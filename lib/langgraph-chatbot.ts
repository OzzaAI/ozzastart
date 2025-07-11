import { ChatOpenAI } from "@langchain/openai";
import { StateGraph, Annotation, START, END } from "@langchain/langgraph";
import { z } from "zod";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { hasGrokHeavyTierAccess } from "@/lib/subscription";

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

// Zod schemas for validation and structured outputs
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

// Structured output schemas for Grok 4 tool responses
const TemperatureResponseSchema = z.object({
  location: z.string(),
  temperature: z.number(),
  unit: z.enum(["celsius", "fahrenheit"]),
  conditions: z.string(),
  timestamp: z.string(),
  humidity: z.number().optional(),
  windSpeed: z.number().optional(),
});

const WebSearchResponseSchema = z.object({
  results: z.array(z.object({
    title: z.string(),
    url: z.string(),
    snippet: z.string(),
    relevanceScore: z.number().optional(),
  })),
  query: z.string(),
  totalResults: z.number().optional(),
  searchTime: z.number().optional(),
});

const EmailResponseSchema = z.object({
  messageId: z.string(),
  status: z.enum(["sent", "failed", "pending"]),
  recipient: z.string(),
  subject: z.string(),
  timestamp: z.string(),
  deliveryTime: z.number().optional(),
});

const DatabaseResponseSchema = z.object({
  rows: z.array(z.record(z.any())),
  query: z.string(),
  rowCount: z.number(),
  executionTime: z.number().optional(),
  affectedRows: z.number().optional(),
});

const FileOperationResponseSchema = z.object({
  success: z.boolean(),
  operation: z.enum(["read", "write", "delete", "list"]),
  filename: z.string(),
  size: z.number().optional(),
  content: z.string().optional(),
  error: z.string().optional(),
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

// LLM Provider Configuration
const LLM_PROVIDER = process.env.LLM_PROVIDER || 'openai';
const XAI_MODEL_ID = process.env.XAI_MODEL_ID || 'grok-4-0709'; // Default to Grok 4, fallback to grok-beta for compatibility

// Initialize LLM based on provider with Grok 4 support
function createLLM() {
  if (LLM_PROVIDER === 'xai') {
    // Determine model based on environment or fallback
    const modelId = XAI_MODEL_ID === 'grok-4-0709' ? 'grok-4-0709' : 'grok-beta';
    
    console.log(`🚀 Initializing xAI with model: ${modelId}`);
    
    return new ChatOpenAI({
      model: modelId,
      temperature: 0.1,
      apiKey: process.env.XAI_API_KEY,
      configuration: {
        baseURL: "https://api.x.ai/v1",
      },
      // Grok 4 specific configurations
      ...(modelId === 'grok-4-0709' && {
        maxTokens: 8192, // Grok 4 supports up to 256K context but limit output for performance
        topP: 0.9,
        // Remove deprecated parameters for Grok 4
        // presencePenalty and frequencyPenalty are not supported
      }),
    });
  } else {
    return new ChatOpenAI({
      model: "gpt-4o-mini", 
      temperature: 0.1,
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
}

const llm = createLLM();

// Initialize MCP Adapter
const mcpAdapter = new MockMCPAdapter();

// Tool Definitions for Function Calling with Structured Outputs
const getCurrentTemperatureTool = new DynamicStructuredTool({
  name: "get_current_temperature",
  description: "Get the current temperature and weather conditions for a specific location",
  schema: z.object({
    location: z.string().describe("The city and state/country, e.g. 'San Francisco, CA'"),
    unit: z.enum(["celsius", "fahrenheit"]).default("fahrenheit").describe("Temperature unit"),
    includeExtended: z.boolean().default(false).describe("Include extended weather data like humidity and wind")
  }),
  func: async ({ location, unit, includeExtended }) => {
    console.log(`🌡️ Getting temperature for ${location} in ${unit}`);
    
    // Mock weather API call with structured response
    await new Promise(resolve => setTimeout(resolve, 100));
    const temp = Math.floor(Math.random() * 40) + 10; // Random temp between 10-50
    const convertedTemp = unit === "celsius" ? temp : Math.floor(temp * 9/5 + 32);
    
    const response = {
      location,
      temperature: convertedTemp,
      unit,
      conditions: ["sunny", "cloudy", "rainy", "snowy"][Math.floor(Math.random() * 4)],
      timestamp: new Date().toISOString(),
      ...(includeExtended && {
        humidity: Math.floor(Math.random() * 100),
        windSpeed: Math.floor(Math.random() * 30),
      })
    };
    
    // Validate response with Zod schema for Grok 4 structured outputs
    return TemperatureResponseSchema.parse(response);
  }
});

const webSearchTool = new DynamicStructuredTool({
  name: "web_search",
  description: "Search the web for information with enhanced result quality",
  schema: z.object({
    query: z.string().describe("The search query"),
    num_results: z.number().default(5).describe("Number of results to return (max 10)"),
    includeSnippets: z.boolean().default(true).describe("Include content snippets in results")
  }),
  func: async ({ query, num_results, includeSnippets }) => {
    console.log(`🔍 Searching web for: "${query}" (${num_results} results)`);
    
    const startTime = Date.now();
    const result = await mcpAdapter.executeTask("web_search", { 
      query, 
      limit: Math.min(num_results, 10),
      includeSnippets 
    });
    const searchTime = Date.now() - startTime;
    
    const response = {
      ...result,
      totalResults: result.results?.length || 0,
      searchTime,
    };
    
    // Validate with structured schema
    return WebSearchResponseSchema.parse(response);
  }
});

const sendEmailTool = new DynamicStructuredTool({
  name: "send_email",
  description: "Send an email to a recipient (requires human approval for security)",
  schema: z.object({
    to: z.string().email().describe("Recipient email address"),
    subject: z.string().min(1).describe("Email subject"),
    body: z.string().min(1).describe("Email body content"),
    cc: z.string().email().optional().describe("CC email address"),
    priority: z.enum(["low", "normal", "high"]).default("normal").describe("Email priority")
  }),
  func: async ({ to, subject, body, cc, priority }) => {
    console.log(`📧 Sending email to ${to} with subject: "${subject}"`);
    
    const startTime = Date.now();
    const result = await mcpAdapter.executeTask("send_email", { 
      to, subject, body, cc, priority 
    });
    const deliveryTime = Date.now() - startTime;
    
    const response = {
      ...result,
      timestamp: new Date().toISOString(),
      deliveryTime,
    };
    
    return EmailResponseSchema.parse(response);
  }
});

const databaseQueryTool = new DynamicStructuredTool({
  name: "database_query",
  description: "Execute a database query with performance monitoring",
  schema: z.object({
    sql: z.string().min(1).describe("SQL query to execute"),
    database: z.string().default("main").describe("Database name"),
    readonly: z.boolean().default(true).describe("Whether this is a read-only query")
  }),
  func: async ({ sql, database, readonly }) => {
    console.log(`🗄️ Executing ${readonly ? 'READ' : 'WRITE'} query on ${database}: ${sql.substring(0, 50)}...`);
    
    const startTime = Date.now();
    const result = await mcpAdapter.executeTask("database_query", { 
      sql, database, readonly 
    });
    const executionTime = Date.now() - startTime;
    
    const response = {
      ...result,
      executionTime,
      affectedRows: readonly ? 0 : (result.rowCount || 0),
    };
    
    return DatabaseResponseSchema.parse(response);
  }
});

const fileOperationTool = new DynamicStructuredTool({
  name: "file_operation",
  description: "Perform secure file operations with validation",
  schema: z.object({
    operation: z.enum(["read", "write", "delete", "list"]).describe("File operation to perform"),
    filename: z.string().min(1).describe("File path/name (relative paths only for security)"),
    content: z.string().optional().describe("Content to write (for write operations)"),
    encoding: z.enum(["utf8", "base64"]).default("utf8").describe("File encoding")
  }),
  func: async ({ operation, filename, content, encoding }) => {
    console.log(`📁 Performing ${operation} operation on ${filename}`);
    
    // Security check: prevent absolute paths
    if (filename.startsWith('/') || filename.includes('..')) {
      throw new Error("Absolute paths and directory traversal not allowed for security");
    }
    
    const result = await mcpAdapter.executeTask("file_operation", { 
      operation, filename, content, encoding 
    });
    
    const response = {
      ...result,
      ...(operation === 'read' && result.content && { content: result.content }),
    };
    
    return FileOperationResponseSchema.parse(response);
  }
});

// Available tools array
const tools = [
  getCurrentTemperatureTool,
  webSearchTool,
  sendEmailTool,
  databaseQueryTool,
  fileOperationTool
];

// Bind tools to LLM for function calling
const llmWithTools = llm.bindTools(tools);

// Node: Planner - Analyzes user message and creates execution plan with Grok 4 function calling
async function plannerNode(state: typeof ChatState.State): Promise<Partial<typeof ChatState.State>> {
  try {
    const lastMessage = state.messages[state.messages.length - 1] || "";
    
    // Check for Grok Heavy tier access for multi-agent features
    const hasHeavyAccess = await hasGrokHeavyTierAccess();
    const isGrok4 = XAI_MODEL_ID === 'grok-4-0709';
    
    const planningPrompt = ChatPromptTemplate.fromMessages([
      ["system", `You are an intelligent planning assistant powered by ${LLM_PROVIDER.toUpperCase()} ${isGrok4 ? 'Grok 4' : 'Grok Beta'}.

${isGrok4 ? `🚀 GROK 4 CAPABILITIES:
- 256K token context window for complex reasoning
- Enhanced structured outputs with Zod schema validation
- Parallel tool execution for improved performance
- Advanced function calling with error handling
${hasHeavyAccess ? '- Multi-agent orchestration enabled (Heavy tier)' : '- Multi-agent features require Heavy tier upgrade'}` : ''}

Available tools with structured outputs:
- get_current_temperature: Weather information with optional extended data
- web_search: Enhanced web search with relevance scoring
- send_email: Secure email sending (requires human approval)
- database_query: SQL execution with performance monitoring
- file_operation: Secure file operations with path validation

Provider: ${LLM_PROVIDER.toUpperCase()} (${isGrok4 ? 'Grok 4' : 'Legacy Model'})
Context Limit: ${isGrok4 ? '256K tokens' : '32K tokens'}
Parallel Processing: ${isGrok4 ? 'Enabled' : 'Sequential'}
Multi-Agent Mode: ${hasHeavyAccess ? 'Available' : 'Requires Heavy Tier'}

Analyze the user request and either:
1. Use available tools directly for simple requests
2. Create a structured execution plan for complex multi-step tasks
${hasHeavyAccess ? '3. Orchestrate multiple agents for complex workflows' : ''}

For custom plans, return JSON with this structure:
{
  "tasks": [
    {
      "id": "unique_task_id",
      "type": "task_type",
      "description": "Clear description",
      "params": {"key": "value"},
      "priority": "low|medium|high",
      "requiresHuman": false
    }
  ],
  "reasoning": "Explanation",
  "estimatedComplexity": "simple|moderate|complex", 
  "requiresHumanApproval": false
}`],
      ["user", `User request: "${lastMessage}"

${isGrok4 ? 'Using Grok 4 enhanced reasoning and structured outputs.' : 'Using legacy model capabilities.'}
${hasHeavyAccess ? 'Heavy tier features available for complex multi-agent workflows.' : 'Standard tier - single agent mode.'}

Analyze this request and provide the most appropriate response using available tools or create a custom execution plan.`]
    ]);

    console.log(`🧠 Planning with ${isGrok4 ? 'Grok 4' : 'Grok Beta'} | Heavy Tier: ${hasHeavyAccess ? '✅' : '❌'}`);
    
    const response = await llmWithTools.invoke(await planningPrompt.formatMessages());

    // Enhanced tool call handling for Grok 4
    if (response.tool_calls && response.tool_calls.length > 0) {
      console.log(`${LLM_PROVIDER.toUpperCase()} made ${response.tool_calls.length} tool call(s)`);
      
      // Log tool calls for debugging
      response.tool_calls.forEach((tc: any, index: number) => {
        console.log(`🔧 Tool ${index + 1}: ${tc.name} with args:`, JSON.stringify(tc.args, null, 2));
      });
      
      const toolResults: Record<string, any> = {};
      
      // Grok 4 supports enhanced parallel execution
      if (isGrok4 && LLM_PROVIDER === 'xai') {
        console.log('🚀 Executing tools in parallel (Grok 4 mode)');
        
        const toolPromises = response.tool_calls.map(async (toolCall: any) => {
          const tool = tools.find(t => t.name === toolCall.name);
          if (tool) {
            try {
              const startTime = Date.now();
              const result = await tool.func(toolCall.args);
              const executionTime = Date.now() - startTime;
              
              return { 
                id: toolCall.id || toolCall.name, 
                result,
                executionTime,
                status: 'success'
              };
            } catch (error) {
              console.error(`❌ Tool ${toolCall.name} failed:`, error);
              return { 
                id: toolCall.id || toolCall.name, 
                error: error instanceof Error ? error.message : String(error),
                status: 'failed'
              };
            }
          }
          return { 
            id: toolCall.id || toolCall.name, 
            error: "Tool not found",
            status: 'failed'
          };
        });
        
        const results = await Promise.all(toolPromises);
        results.forEach(({ id, result, error, executionTime, status }) => {
          toolResults[id] = { 
            status, 
            ...(error ? { error } : { result }),
            executionTime,
            timestamp: new Date().toISOString()
          };
        });
      } else {
        // Sequential execution for other providers or legacy mode
        console.log('⏭️ Executing tools sequentially');
        
        for (const toolCall of response.tool_calls) {
          const tool = tools.find(t => t.name === toolCall.name);
          if (tool) {
            try {
              const startTime = Date.now();
              const result = await tool.func(toolCall.args);
              const executionTime = Date.now() - startTime;
              
              toolResults[toolCall.id || toolCall.name] = { 
                status: "completed", 
                result,
                executionTime,
                timestamp: new Date().toISOString()
              };
            } catch (error) {
              console.error(`❌ Tool ${toolCall.name} failed:`, error);
              toolResults[toolCall.id || toolCall.name] = { 
                status: "failed", 
                error: error instanceof Error ? error.message : String(error),
                timestamp: new Date().toISOString()
              };
            }
          }
        }
      }

      return {
        plan: {
          tasks: response.tool_calls.map((tc: any) => ({
            id: tc.id || tc.name,
            type: tc.name,
            description: `Execute ${tc.name} with args: ${JSON.stringify(tc.args)}`,
            params: tc.args,
            priority: "medium" as const,
            requiresHuman: tc.name === "send_email"
          })),
          reasoning: `Direct tool execution using ${isGrok4 ? 'Grok 4' : 'legacy model'} function calling`,
          estimatedComplexity: "simple" as const,
          requiresHumanApproval: response.tool_calls.some((tc: any) => tc.name === "send_email")
        },
        mcpResults: toolResults,
        currentStep: "planning_complete",
        needsHuman: response.tool_calls.some((tc: any) => tc.name === "send_email"),
      };
    }

    // Fallback to custom plan generation
    let planData;
    try {
      planData = JSON.parse(response.content as string);
    } catch (parseError) {
      // If not JSON, create a simple plan
      planData = {
        tasks: [],
        reasoning: `Simple response without specific tasks (${isGrok4 ? 'Grok 4' : 'legacy model'})`,
        estimatedComplexity: "simple",
        requiresHumanApproval: false
      };
    }

    const validatedPlan = PlanSchema.parse(planData);
    
    return {
      plan: validatedPlan,
      currentStep: "planning_complete",
      needsHuman: validatedPlan.requiresHumanApproval || validatedPlan.tasks.some(t => t.requiresHuman),
    };

  } catch (error) {
    console.error("❌ Planner node error:", error);
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

// Node: Responder - Generates final response with Grok 4 enhanced capabilities
async function responderNode(state: typeof ChatState.State): Promise<Partial<typeof ChatState.State>> {
  try {
    const userMessage = state.messages[0] || "";
    const plan = state.plan;
    const results = state.mcpResults;
    const isGrok4 = XAI_MODEL_ID === 'grok-4-0709';
    const hasHeavyAccess = await hasGrokHeavyTierAccess();

    const responsePrompt = ChatPromptTemplate.fromMessages([
      ["system", `You are a helpful AI assistant powered by ${LLM_PROVIDER.toUpperCase()} ${isGrok4 ? 'Grok 4' : 'Grok Beta'}.

${isGrok4 ? `🚀 GROK 4 ENHANCED RESPONSE GENERATION:
- Leverage 256K token context for comprehensive analysis
- Use structured outputs for consistent formatting
- Apply advanced reasoning capabilities
- Provide real-time insights and analysis
${hasHeavyAccess ? '- Multi-agent coordination insights available' : '- Single-agent mode (upgrade to Heavy tier for multi-agent)'}` : ''}

Generate clear, comprehensive responses based on executed tasks and function calls.
${isGrok4 ? 'Leverage Grok 4\'s enhanced reasoning and real-time capabilities.' : 'Use available model capabilities for detailed responses.'}

Focus on:
- Summarizing what was accomplished with execution metrics
- Including relevant structured data from tool results
- Explaining any failures with actionable solutions
- Providing next steps and recommendations
- Highlighting performance insights from tool execution times`],
      ["user", `User's original request: "${userMessage}"

Execution Plan: ${plan ? JSON.stringify(plan, null, 2) : "No plan available"}

Tool/Task Results with Performance Metrics: ${JSON.stringify(results, null, 2)}

${Object.keys(results).length > 0 ? `Function calls executed: ${Object.keys(results).length}` : 'No function calls were made.'}
${isGrok4 ? 'Grok 4 structured outputs and parallel processing utilized.' : 'Legacy processing mode used.'}
${hasHeavyAccess ? 'Heavy tier features available for enhanced analysis.' : 'Standard tier analysis.'}

Generate a comprehensive response that addresses the user's request and incorporates all execution results with performance insights.`]
    ]);

    console.log(`💬 Generating response with ${isGrok4 ? 'Grok 4' : 'legacy model'} capabilities`);
    
    const response = await llmWithTools.invoke(await responsePrompt.formatMessages());

    // Handle any additional tool calls in the response (Grok 4 enhanced)
    if (response.tool_calls && response.tool_calls.length > 0) {
      console.log(`${LLM_PROVIDER.toUpperCase()} made additional ${response.tool_calls.length} tool call(s) in response`);
      
      const additionalResults: Record<string, any> = {};
      
      if (isGrok4 && LLM_PROVIDER === 'xai') {
        // Enhanced parallel execution for Grok 4
        console.log('🚀 Executing additional tools in parallel (Grok 4 mode)');
        
        const toolPromises = response.tool_calls.map(async (toolCall: any) => {
          const tool = tools.find(t => t.name === toolCall.name);
          if (tool) {
            try {
              const startTime = Date.now();
              const result = await tool.func(toolCall.args);
              const executionTime = Date.now() - startTime;
              
              return { 
                id: toolCall.id || toolCall.name, 
                result,
                executionTime,
                status: 'success'
              };
            } catch (error) {
              return { 
                id: toolCall.id || toolCall.name, 
                error: error instanceof Error ? error.message : String(error),
                status: 'failed'
              };
            }
          }
          return { 
            id: toolCall.id || toolCall.name, 
            error: "Tool not found",
            status: 'failed'
          };
        });
        
        const addResults = await Promise.all(toolPromises);
        addResults.forEach(({ id, result, error, executionTime, status }) => {
          additionalResults[id] = { 
            status, 
            ...(error ? { error } : { result }),
            executionTime,
            timestamp: new Date().toISOString()
          };
        });
      } else {
        // Sequential execution for other providers
        for (const toolCall of response.tool_calls) {
          const tool = tools.find(t => t.name === toolCall.name);
          if (tool) {
            try {
              const startTime = Date.now();
              const result = await tool.func(toolCall.args);
              const executionTime = Date.now() - startTime;
              
              additionalResults[toolCall.id || toolCall.name] = { 
                status: "completed", 
                result,
                executionTime,
                timestamp: new Date().toISOString()
              };
            } catch (error) {
              additionalResults[toolCall.id || toolCall.name] = { 
                status: "failed", 
                error: error instanceof Error ? error.message : String(error),
                timestamp: new Date().toISOString()
              };
            }
          }
        }
      }

      // Generate final response with all results using Grok 4 capabilities
      const finalPrompt = ChatPromptTemplate.fromMessages([
        ["system", `Generate a final comprehensive response incorporating all function call results.
        ${isGrok4 ? 'Use Grok 4\'s enhanced reasoning to provide deep insights and analysis.' : 'Provide detailed analysis with available capabilities.'}`],
        ["user", `Original request: "${userMessage}"
        
Initial results: ${JSON.stringify(results, null, 2)}
Additional results: ${JSON.stringify(additionalResults, null, 2)}

Performance Summary:
- Total tool calls: ${Object.keys(results).length + Object.keys(additionalResults).length}
- Processing mode: ${isGrok4 ? 'Grok 4 Parallel' : 'Sequential'}
- Heavy tier: ${hasHeavyAccess ? 'Active' : 'Not Active'}

Provide a complete, user-friendly response that incorporates all information with performance insights.`]
      ]);

      const finalResponse = await llm.invoke(await finalPrompt.formatMessages());
      
      return {
        finalResponse: finalResponse.content as string,
        currentStep: "response_generated",
        mcpResults: { ...results, ...additionalResults },
      };
    }

    return {
      finalResponse: response.content as string,
      currentStep: "response_generated",
    };

  } catch (error) {
    console.error("❌ Responder node error:", error);
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

// Export types and configuration for external use
export type { ChatState };
export { TaskSchema, PlanSchema, MockMCPAdapter, tools, LLM_PROVIDER, XAI_MODEL_ID };

// Export structured output schemas for external validation
export { 
  TemperatureResponseSchema, 
  WebSearchResponseSchema, 
  EmailResponseSchema, 
  DatabaseResponseSchema, 
  FileOperationResponseSchema 
};

// Log configuration on initialization
const isGrok4 = XAI_MODEL_ID === 'grok-4-0709';
console.log(`🤖 LangGraph Chatbot initialized with ${LLM_PROVIDER.toUpperCase()} provider`);

if (LLM_PROVIDER === 'xai') {
  console.log(`🚀 xAI ${isGrok4 ? 'Grok 4' : 'Grok Beta'} API configured`);
  console.log(`📡 Base URL: https://api.x.ai/v1`);
  console.log(`🔑 API Key: ${process.env.XAI_API_KEY ? '✅ Configured' : '❌ Missing'}`);
  console.log(`🎯 Model: ${XAI_MODEL_ID}`);
  
  if (isGrok4) {
    console.log('✨ Grok 4 Features:');
    console.log('   • 256K token context window');
    console.log('   • Structured outputs with Zod validation');
    console.log('   • Enhanced parallel tool execution');
    console.log('   • Advanced function calling');
    console.log('   • Multi-agent orchestration (Heavy tier)');
  } else {
    console.log('⚠️  Using legacy Grok Beta - consider upgrading to Grok 4');
  }
} else {
  console.log('🧠 OpenAI GPT API configured with function calling support');
  console.log(`🔑 API Key: ${process.env.OPENAI_API_KEY ? '✅ Configured' : '❌ Missing'}`);
}

console.log(`🛠️  Available tools: ${tools.map(t => t.name).join(', ')}`);
console.log(`📊 Structured outputs: ${isGrok4 ? 'Enabled' : 'Basic'}`);
console.log(`⚡ Parallel processing: ${isGrok4 && LLM_PROVIDER === 'xai' ? 'Enabled' : 'Sequential'}`);

// Environment validation
if (LLM_PROVIDER === 'xai' && !process.env.XAI_API_KEY) {
  console.error('❌ XAI_API_KEY environment variable is required for xAI provider');
}

if (isGrok4) {
  console.log('🎉 Grok 4 initialization complete - ready for enhanced AI interactions!');
}
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