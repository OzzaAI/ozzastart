import { NextRequest, NextResponse } from "next/server";
import { convertWorkflowToMCP } from "@/lib/workflow-to-mcp-converter";
import { db } from "@/db/drizzle";
import { agents } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic';

// Request body validation schema
const ConvertRequestSchema = z.object({
  workflowJson: z.string().min(1, "Workflow JSON is required"),
  agentName: z.string().min(1, "Agent name is required").optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Get the session using Better Auth
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Please sign in" },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = ConvertRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request",
          details: (validationResult.error.errors || []).map(e => `${e.path.join(".")}: ${e.message}`).join(", ") || "Validation failed"
        },
        { status: 400 }
      );
    }

    const { workflowJson, agentName } = validationResult.data;

    // Convert workflow to MCP agent specification
    let yamlSpec: string;
    let workflowName: string;

    try {
      yamlSpec = await convertWorkflowToMCP(workflowJson);
      
      // Extract workflow name from JSON for agent naming
      const parsedWorkflow = JSON.parse(workflowJson);
      workflowName = agentName || parsedWorkflow.name || "Unnamed Workflow";
    } catch (conversionError) {
      console.error("Workflow conversion error:", conversionError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to convert workflow",
          details: conversionError instanceof Error ? conversionError.message : String(conversionError)
        },
        { status: 400 }
      );
    }

    // Store the agent specification in the database
    try {
      const [newAgent] = await db.insert(agents).values({
        userId: session.user.id,
        name: workflowName,
        spec: yamlSpec,
      }).returning();

      console.log(`Agent created successfully: ${newAgent.id} for user ${session.user.id}`);

      return NextResponse.json({
        success: true,
        yaml: yamlSpec,
        agent: {
          id: newAgent.id,
          name: newAgent.name,
          createdAt: newAgent.createdAt,
        }
      });

    } catch (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to save agent",
          details: "Could not store the agent specification in the database"
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("API route error:", error);
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
    { success: false, error: "Method not allowed" },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { success: false, error: "Method not allowed" },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { success: false, error: "Method not allowed" },
    { status: 405 }
  );
}