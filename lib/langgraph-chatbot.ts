import { ChatOpenAI } from "@langchain/openai";
import { StateGraph, Annotation, START, END } from "@langchain/langgraph";
import { z } from "zod";

// Mock MCP Adapter (in production, replace with langchain-mcp-adapters)
interface MCPAdapter {
  executeTask(taskType: string, params: Record<string, any>): Promise<any>;
  validateScopes(scopes: string[]): Promise<{ valid: boolean; invalidScopes: string[] }>;
}

class MockMCPAdapter implements MCPAdapter {
  async executeTask(taskType: string, params: Record<string, any>): Promise<any> {
    // Simulate async MCP task execution
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 400));
    
    const mockResults: Record<string, any> = {
      "web_search": {
        results: [
          { title: "Sample Search Result", url: "https://example.com", snippet: "Mock search result content..." },
          { title: "Another Result", url: "https://example2.com", snippet: "More mock content..." }
        ],
        query: params.query || "default query"
      },
      "send_email": {
        messageId: `msg_${Date.now()}`,
        status: "sent",
        recipient: params.to || "user@example.com",
        subject: params.subject || "Default Subject"
      },
      "database_query": {
        rows: [
          { id: 1, name: "Sample Data", value: 42 },
          { id: 2, name: "More Data", value: 84 }
        ],
        query: params.sql || "SELECT * FROM sample_table",
        rowCount: 2
      },
      "file_operation": {
        success: true,
        operation: params.operation || "read",
        filename: params.filename || "sample.txt",
        size: 1024
      },
      "api_call": {
        status: 200,
        data: { message: "API call successful", timestamp: new Date().toISOString() },
        endpoint: params.endpoint || "/api/sample"
      }
    };

    return mockResults[taskType] || { 
      error: `Unknown task type: ${taskType}`,
      taskType,
      params 
    };
  }

  async validateScopes(scopes: string[]): Promise<{ valid: boolean; invalidScopes: string[] }> {
    const validScopes = [
      "web:search", "email:send", "database:read", "database:write", 
      "file:read", "file:write", "api:call", "external:webhook"
    ];
    const invalidScopes = scopes.filter(scope => !validScopes.includes(scope));
    return { valid: invalidScopes.length === 0, invalidScopes };
  }
}

// Zod schemas for validation
const TaskSchema = z.object({
  id: z.string(),
  type: z.string(),
  description: z.string(),
  params: z.record(z.any()),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  requiresHuman: z.boolean().default(false),
});

const PlanSchema = z.object({
  tasks: z.array(TaskSchema),
  reasoning: z.string(),
  estimatedComplexity: z.enum(["simple", "moderate", "complex"]),
  requiresHumanApproval: z.boolean(),
});

// State interface for LangGraph
const ChatState = Annotation.Root({
  messages: Annotation<string[]>({
    reducer: (existing, update) => [...(existing || []), ...update],
    default: () => [],
  }),
  plan: Annotation<z.infer<typeof PlanSchema> | null>({
    reducer: (existing, update) => update ?? existing,
    default: () => null,
  }),
  mcpResults: Annotation<Record<string, any>>({
    reducer: (existing, update) => ({ ...(existing || {}), ...update }),
    default: () => ({}),
  }),
  needsHuman: Annotation<boolean>({
    reducer: (existing, update) => update ?? existing,
    default: () => false,
  }),
  currentStep: Annotation<string>({
    reducer: (existing, update) => update ?? existing,
    default: () => "start",
  }),
  errorMessage: Annotation<string | null>({
    reducer: (existing, update) => update ?? existing,
    default: () => null,
  }),
  finalResponse: Annotation<string | null>({
    reducer: (existing, update) => update ?? existing,
    default: () => null,
  }),
});

// Initialize OpenAI LLM
const llm = new ChatOpenAI({
  model: "gpt-4o-mini",
  temperature: 0.1,
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize MCP Adapter
const mcpAdapter = new MockMCPAdapter();

// Node: Planner - Analyzes user message and creates execution plan
async function plannerNode(state: typeof ChatState.State): Promise<Partial<typeof ChatState.State>> {
  try {
    const lastMessage = state.messages[state.messages.length - 1] || "";
    
    const planningPrompt = `
Analyze the user's message and create a detailed execution plan. Return a JSON object with the following structure:

{
  "tasks": [
    {
      "id": "unique_task_id",
      "type": "task_type (web_search, send_email, database_query, file_operation, api_call, etc.)",
      "description": "Clear description of what this task does",
      "params": {"key": "value pairs for task execution"},
      "priority": "low|medium|high",
      "requiresHuman": false
    }
  ],
  "reasoning": "Explanation of why these tasks are needed",
  "estimatedComplexity": "simple|moderate|complex",
  "requiresHumanApproval": false
}

User message: "${lastMessage}"

Guidelines:
- Break complex requests into smaller, manageable tasks
- Include all necessary parameters for each task
- Set requiresHuman=true for sensitive operations (email sending, data deletion, financial transactions)
- Set requiresHumanApproval=true for plans that modify important data or have significant impact
- Use appropriate task types based on available MCP capabilities
- Prioritize tasks logically (dependencies, importance)

Return only the JSON object, no additional text.
`;

    const response = await llm.invoke([
      { role: "system", content: "You are a task planning assistant. Create detailed, executable plans for user requests." },
      { role: "user", content: planningPrompt }
    ]);

    let planData;
    try {
      planData = JSON.parse(response.content as string);
    } catch (parseError) {
      console.error("Failed to parse plan JSON:", parseError);
      throw new Error("Invalid plan format generated");
    }

    const validatedPlan = PlanSchema.parse(planData);
    
    return {
      plan: validatedPlan,
      currentStep: "planning_complete",
      needsHuman: validatedPlan.requiresHumanApproval || validatedPlan.tasks.some(t => t.requiresHuman),
    };

  } catch (error) {
    console.error("Planner node error:", error);
    return {
      errorMessage: error instanceof Error ? error.message : "Planning failed",
      currentStep: "planning_failed",
    };
  }
}

// Node: Task Runner - Executes MCP tasks from the plan
async function taskRunnerNode(state: typeof ChatState.State): Promise<Partial<typeof ChatState.State>> {
  try {
    if (!state.plan || !state.plan.tasks.length) {
      throw new Error("No valid plan available for execution");
    }

    const results: Record<string, any> = {};
    const executedTasks: string[] = [];

    // Execute tasks in priority order
    const sortedTasks = [...state.plan.tasks].sort((a, b) => {
      const priorityOrder = { "high": 3, "medium": 2, "low": 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    for (const task of sortedTasks) {
      try {
        console.log(`Executing task: ${task.id} (${task.type})`);
        
        // Skip human-required tasks if human approval hasn't been granted
        if (task.requiresHuman && state.needsHuman) {
          results[task.id] = {
            status: "pending_human_approval",
            message: "Task requires human approval before execution",
            task: task.description
          };
          continue;
        }

        // Execute the task via MCP adapter
        const taskResult = await mcpAdapter.executeTask(task.type, task.params);
        
        results[task.id] = {
          status: "completed",
          result: taskResult,
          executedAt: new Date().toISOString(),
          task: task.description
        };
        
        executedTasks.push(task.id);

      } catch (taskError) {
        console.error(`Task ${task.id} failed:`, taskError);
        results[task.id] = {
          status: "failed",
          error: taskError instanceof Error ? taskError.message : String(taskError),
          task: task.description
        };
      }
    }

    return {
      mcpResults: results,
      currentStep: "tasks_executed",
      messages: [`Executed ${executedTasks.length} tasks successfully`],
    };

  } catch (error) {
    console.error("Task runner error:", error);
    return {
      errorMessage: error instanceof Error ? error.message : "Task execution failed",
      currentStep: "execution_failed",
    };
  }
}

// Node: Responder - Generates final response based on plan and results
async function responderNode(state: typeof ChatState.State): Promise<Partial<typeof ChatState.State>> {
  try {
    const userMessage = state.messages[0] || "";
    const plan = state.plan;
    const results = state.mcpResults;

    const responsePrompt = `
Generate a helpful, comprehensive response to the user based on the executed plan and results.

User's original message: "${userMessage}"

Execution Plan: ${plan ? JSON.stringify(plan, null, 2) : "No plan available"}

Task Results: ${JSON.stringify(results, null, 2)}

Guidelines:
- Provide a clear, user-friendly summary of what was accomplished
- Include relevant data or information from the task results
- If any tasks failed, explain what went wrong and suggest alternatives
- If tasks are pending human approval, clearly communicate next steps
- Be concise but informative
- Use a helpful, professional tone

Generate the response:
`;

    const response = await llm.invoke([
      { role: "system", content: "You are a helpful AI assistant. Provide clear, comprehensive responses based on executed tasks." },
      { role: "user", content: responsePrompt }
    ]);

    return {
      finalResponse: response.content as string,
      currentStep: "response_generated",
    };

  } catch (error) {
    console.error("Responder node error:", error);
    return {
      errorMessage: error instanceof Error ? error.message : "Response generation failed",
      currentStep: "response_failed",
      finalResponse: "I apologize, but I encountered an error while generating a response. Please try again.",
    };
  }
}

// Node: Human Loop - Handles human intervention requirements
async function humanLoopNode(state: typeof ChatState.State): Promise<Partial<typeof ChatState.State>> {
  try {
    const plan = state.plan;
    const humanRequiredTasks = plan?.tasks.filter(t => t.requiresHuman) || [];

    const escalationPrompt = `
This request requires human approval or intervention before proceeding.

Original request: "${state.messages[0] || ""}"

Tasks requiring human approval:
${humanRequiredTasks.map(t => `- ${t.description} (${t.type})`).join('\n')}

Reasoning: ${plan?.reasoning || "No reasoning provided"}

Please review and approve/modify this plan before execution continues.
`;

    return {
      finalResponse: escalationPrompt,
      currentStep: "awaiting_human_approval",
      needsHuman: true,
    };

  } catch (error) {
    console.error("Human loop node error:", error);
    return {
      errorMessage: error instanceof Error ? error.message : "Human loop processing failed",
      currentStep: "human_loop_failed",
    };
  }
}

// Conditional edge functions
function shouldRouteToHuman(state: typeof ChatState.State): string {
  if (state.needsHuman && state.currentStep === "planning_complete") {
    return "human_loop";
  }
  return "task_runner";
}

function shouldRetry(state: typeof ChatState.State): string {
  if (state.errorMessage) {
    return END;
  }
  if (state.currentStep === "awaiting_human_approval") {
    return END;
  }
  return "responder";
}

// Build the LangGraph workflow
const workflow = new StateGraph(ChatState)
  // Add nodes
  .addNode("planner", plannerNode)
  .addNode("task_runner", taskRunnerNode)
  .addNode("responder", responderNode)
  .addNode("human_loop", humanLoopNode)
  
  // Define edges
  .addEdge(START, "planner")
  .addConditionalEdges("planner", shouldRouteToHuman, {
    task_runner: "task_runner",
    human_loop: "human_loop"
  })
  .addConditionalEdges("task_runner", shouldRetry, {
    responder: "responder",
    [END]: END
  })
  .addEdge("responder", END)
  .addEdge("human_loop", END);

// Compile the graph
export const agenticChatbot = workflow.compile();

// Export types for external use
export type { ChatState };
export { TaskSchema, PlanSchema, MockMCPAdapter };

// Utility function to run the chatbot
export async function runAgenticChatbot(
  userMessage: string,
  previousState?: Partial<typeof ChatState.State>
): Promise<typeof ChatState.State> {
  try {
    const initialState: Partial<typeof ChatState.State> = {
      messages: [userMessage],
      ...previousState,
    };

    const result = await agenticChatbot.invoke(initialState);
    return result;

  } catch (error) {
    console.error("Agentic chatbot execution error:", error);
    
    // Return error state
    return {
      messages: [userMessage],
      plan: null,
      mcpResults: {},
      needsHuman: false,
      currentStep: "error",
      errorMessage: error instanceof Error ? error.message : "Unknown error occurred",
      finalResponse: "I apologize, but I encountered an error processing your request. Please try again.",
    };
  }
}

// Stream execution function for real-time updates
export async function* streamAgenticChatbot(
  userMessage: string,
  previousState?: Partial<typeof ChatState.State>
): AsyncGenerator<typeof ChatState.State, void, unknown> {
  try {
    const initialState: Partial<typeof ChatState.State> = {
      messages: [userMessage],
      ...previousState,
    };

    const stream = await agenticChatbot.stream(initialState);
    
    for await (const step of stream) {
      yield step;
    }

  } catch (error) {
    console.error("Agentic chatbot streaming error:", error);
    
    yield {
      messages: [userMessage],
      plan: null,
      mcpResults: {},
      needsHuman: false,
      currentStep: "error",
      errorMessage: error instanceof Error ? error.message : "Unknown error occurred",
      finalResponse: "I apologize, but I encountered an error processing your request. Please try again.",
    };
  }
}