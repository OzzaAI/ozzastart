import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db/drizzle";
import { chat_sessions, agents } from "@/db/schema";
import { 
  agenticChatbot, 
  runAgenticChatbot, 
  streamAgenticChatbot,
  type ChatState 
} from "@/lib/langgraph-chatbot";

// Request validation schema
const ChatRequestSchema = z.object({
  message: z.string().min(1, "Message is required"),
  sessionId: z.string().min(1, "Session ID is required"),
  agentId: z.string().uuid().optional(),
  streaming: z.boolean().default(false),
  metadata: z.record(z.any()).optional(),
});

// Response schemas
const ChatResponseSchema = z.object({
  response: z.string(),
  sessionId: z.string(),
  updatedState: z.record(z.any()).optional(),
  needsHuman: z.boolean().optional(),
  agentName: z.string().optional(),
  executionSteps: z.array(z.string()).optional(),
});

// Session state management
interface SessionState {
  messages: string[];
  plan: any | null;
  mcpResults: Record<string, any>;
  needsHuman: boolean;
  currentStep: string;
  errorMessage: string | null;
  finalResponse: string | null;
  agentSpec?: string;
  sessionMetadata?: Record<string, any>;
}

// Load session state from database
async function loadSessionState(
  userId: string, 
  sessionId: string, 
  agentId?: string
): Promise<SessionState> {
  try {
    // Load existing session
    const [existingSession] = await db
      .select()
      .from(chat_sessions)
      .where(
        and(
          eq(chat_sessions.userId, userId),
          eq(chat_sessions.sessionId, sessionId)
        )
      )
      .limit(1);

    let agentSpec: string | undefined;
    let agentName: string | undefined;

    // Load agent specification if provided
    if (agentId) {
      const [agent] = await db
        .select()
        .from(agents)
        .where(
          and(
            eq(agents.id, agentId),
            eq(agents.userId, userId)
          )
        )
        .limit(1);

      if (agent) {
        agentSpec = agent.spec;
        agentName = agent.name;
      }
    }

    if (existingSession) {
      // Return existing state with potential agent update
      const state = existingSession.state as SessionState;
      return {
        ...state,
        agentSpec: agentSpec || state.agentSpec,
        sessionMetadata: {
          ...state.sessionMetadata,
          agentName,
          lastUpdated: existingSession.updatedAt,
        }
      };
    }

    // Create new session state
    const newState: SessionState = {
      messages: [],
      plan: null,
      mcpResults: {},
      needsHuman: false,
      currentStep: "start",
      errorMessage: null,
      finalResponse: null,
      agentSpec,
      sessionMetadata: {
        agentName,
        createdAt: new Date().toISOString(),
      }
    };

    return newState;

  } catch (error) {
    console.error("Error loading session state:", error);
    throw new Error("Failed to load session state");
  }
}

// Save session state to database
async function saveSessionState(
  userId: string,
  sessionId: string,
  state: SessionState,
  agentId?: string
): Promise<void> {
  try {
    const now = new Date();
    
    // Remove sensitive data before saving
    const sanitizedState = {
      ...state,
      sessionMetadata: {
        ...state.sessionMetadata,
        lastUpdated: now.toISOString(),
      }
    };

    // Upsert session
    await db
      .insert(chat_sessions)
      .values({
        userId,
        sessionId,
        agentId: agentId || null,
        state: sanitizedState,
        metadata: sanitizedState.sessionMetadata || {},
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [chat_sessions.userId, chat_sessions.sessionId],
        set: {
          agentId: agentId || null,
          state: sanitizedState,
          metadata: sanitizedState.sessionMetadata || {},
          updatedAt: now,
        },
      });

  } catch (error) {
    console.error("Error saving session state:", error);
    throw new Error("Failed to save session state");
  }
}

// Convert LangGraph state to session state
function convertToSessionState(
  langGraphState: typeof ChatState.State,
  agentSpec?: string,
  sessionMetadata?: Record<string, any>
): SessionState {
  return {
    messages: langGraphState.messages || [],
    plan: langGraphState.plan,
    mcpResults: langGraphState.mcpResults || {},
    needsHuman: langGraphState.needsHuman || false,
    currentStep: langGraphState.currentStep || "start",
    errorMessage: langGraphState.errorMessage,
    finalResponse: langGraphState.finalResponse,
    agentSpec,
    sessionMetadata,
  };
}

// Convert session state to LangGraph state
function convertToLangGraphState(sessionState: SessionState): Partial<typeof ChatState.State> {
  return {
    messages: sessionState.messages,
    plan: sessionState.plan,
    mcpResults: sessionState.mcpResults,
    needsHuman: sessionState.needsHuman,
    currentStep: sessionState.currentStep,
    errorMessage: sessionState.errorMessage,
    finalResponse: sessionState.finalResponse,
  };
}

// Handle streaming responses
async function handleStreamingChat(
  userMessage: string,
  previousState: Partial<typeof ChatState.State>
): Promise<Response> {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const chatStream = streamAgenticChatbot(userMessage, previousState);
        
        for await (const step of chatStream) {
          const chunk = {
            type: "step",
            step: step.currentStep,
            data: {
              currentStep: step.currentStep,
              needsHuman: step.needsHuman,
              finalResponse: step.finalResponse,
              errorMessage: step.errorMessage,
            }
          };
          
          const sseData = `data: ${JSON.stringify(chunk)}\n\n`;
          controller.enqueue(encoder.encode(sseData));
        }
        
        controller.enqueue(encoder.encode(`data: {"type": "complete"}\n\n`));
        controller.close();
        
      } catch (error) {
        const errorChunk = {
          type: "error",
          error: error instanceof Error ? error.message : "Stream processing failed"
        };
        
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorChunk)}\n\n`));
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

// Main POST handler
export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Please sign in" },
        { status: 401 }
      );
    }

    // Parse and validate request
    const body = await request.json();
    const validationResult = ChatRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request",
          details: validationResult.error.errors.map(e => `${e.path.join(".")}: ${e.message}`).join(", ")
        },
        { status: 400 }
      );
    }

    const { message, sessionId, agentId, streaming, metadata } = validationResult.data;

    // Load session state
    let sessionState: SessionState;
    try {
      sessionState = await loadSessionState(session.user.id, sessionId, agentId);
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to load session",
          details: error instanceof Error ? error.message : "Session loading error"
        },
        { status: 500 }
      );
    }

    // Convert to LangGraph state and add new message
    const langGraphState = convertToLangGraphState(sessionState);
    
    // Handle streaming if requested
    if (streaming) {
      return handleStreamingChat(message, langGraphState);
    }

    // Execute chatbot
    let result: typeof ChatState.State;
    try {
      result = await runAgenticChatbot(message, langGraphState);
    } catch (error) {
      console.error("Chatbot execution error:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Chatbot execution failed",
          details: error instanceof Error ? error.message : "Unknown execution error"
        },
        { status: 500 }
      );
    }

    // Convert result back to session state
    const updatedSessionState = convertToSessionState(
      result,
      sessionState.agentSpec,
      {
        ...sessionState.sessionMetadata,
        ...metadata,
        lastMessage: message,
        executionTime: new Date().toISOString(),
      }
    );

    // Save updated state
    try {
      await saveSessionState(session.user.id, sessionId, updatedSessionState, agentId);
    } catch (error) {
      console.error("Session save error:", error);
      // Continue with response even if save fails
    }

    // Prepare response
    const response: z.infer<typeof ChatResponseSchema> = {
      response: result.finalResponse || "I apologize, but I couldn't generate a proper response. Please try again.",
      sessionId,
      updatedState: {
        currentStep: result.currentStep,
        needsHuman: result.needsHuman,
        hasError: !!result.errorMessage,
        planGenerated: !!result.plan,
        tasksExecuted: Object.keys(result.mcpResults || {}).length,
      },
      needsHuman: result.needsHuman,
      agentName: updatedSessionState.sessionMetadata?.agentName,
      executionSteps: [
        result.currentStep || "unknown"
      ].filter(Boolean),
    };

    // Handle human escalation
    if (result.needsHuman) {
      response.response = result.finalResponse || 
        "This request requires human approval. Please review the proposed actions before proceeding.";
    }

    return NextResponse.json({
      success: true,
      ...response,
    });

  } catch (error) {
    console.error("Chat API route error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "An unexpected error occurred"
      },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { success: false, error: "Method not allowed. Use POST for chat interactions." },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { success: false, error: "Method not allowed. Use POST for chat interactions." },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { success: false, error: "Method not allowed. Use POST for chat interactions." },
    { status: 405 }
  );
}

// Export types for external use
export type { SessionState, ChatRequestSchema, ChatResponseSchema };