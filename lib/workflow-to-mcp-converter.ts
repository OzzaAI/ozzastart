import { z } from "zod";

// Zod schemas for workflow JSON validation
const WorkflowNodeSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["trigger", "action", "condition"]),
  typeVersion: z.number().optional(),
  position: z.array(z.number()).length(2),
  parameters: z.record(z.any()).optional(),
  credentials: z.record(z.any()).optional(),
  webhookId: z.string().optional(),
  disabled: z.boolean().optional(),
});

const WorkflowConnectionSchema = z.object({
  node: z.string(),
  type: z.string(),
  index: z.number().optional(),
});

const WorkflowConnectionMappingSchema = z.object({
  source: WorkflowConnectionSchema,
  destination: WorkflowConnectionSchema,
});

const WorkflowSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  nodes: z.array(WorkflowNodeSchema),
  connections: z.array(WorkflowConnectionMappingSchema).optional(),
  active: z.boolean().optional(),
  settings: z.record(z.any()).optional(),
  staticData: z.record(z.any()).optional(),
  tags: z.array(z.string()).optional(),
  meta: z.record(z.any()).optional(),
  pinData: z.record(z.any()).optional(),
  versionId: z.string().optional(),
});

// MCP Agent spec types
interface MCPServer {
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

interface MCPMethod {
  name: string;
  description: string;
  params: {
    type: "object";
    properties: Record<string, any>;
    required?: string[];
  };
  result?: {
    type: string;
    description?: string;
  };
}

interface MCPAgentSpec {
  name: string;
  description: string;
  version: string;
  servers: Record<string, MCPServer>;
  methods: MCPMethod[];
  scopes: string[];
  humanLoop: boolean;
}

// Mock MCP adapter for scope validation
class MockMCPAdapter {
  private validScopes = [
    "read:data",
    "write:data", 
    "execute:actions",
    "manage:workflows",
    "access:external_apis",
    "send:notifications",
    "read:files",
    "write:files",
    "database:read",
    "database:write",
    "http:request",
    "webhook:receive",
    "email:send",
    "sms:send",
    "calendar:read",
    "calendar:write",
    "storage:read",
    "storage:write"
  ];

  async validateScopes(scopes: string[]): Promise<{ valid: boolean; invalidScopes: string[] }> {
    // Simulate async validation with a small delay
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const invalidScopes = scopes.filter(scope => !this.validScopes.includes(scope));
    return {
      valid: invalidScopes.length === 0,
      invalidScopes
    };
  }

  async getAvailableScopes(): Promise<string[]> {
    await new Promise(resolve => setTimeout(resolve, 30));
    return [...this.validScopes];
  }
}

// Node type to MCP capability mapping
class WorkflowToMCPMapper {
  private mcpAdapter: MockMCPAdapter;

  constructor() {
    this.mcpAdapter = new MockMCPAdapter();
  }

  private mapNodeTypeToMethod(node: z.infer<typeof WorkflowNodeSchema>): MCPMethod {
    const baseMethod: MCPMethod = {
      name: this.sanitizeMethodName(node.name),
      description: `Generated method for ${node.name} (${node.type})`,
      params: {
        type: "object",
        properties: {},
        required: []
      }
    };

    // Map node parameters to method parameters
    if (node.parameters) {
      for (const [key, value] of Object.entries(node.parameters)) {
        baseMethod.params.properties[key] = {
          type: this.inferParameterType(value),
          description: `Parameter ${key} for ${node.name}`
        };
      }
    }

    // Set result type based on node type
    if (node.type === "trigger") {
      baseMethod.result = {
        type: "object",
        description: "Trigger event data"
      };
    } else if (node.type === "action") {
      baseMethod.result = {
        type: "object", 
        description: "Action execution result"
      };
    } else if (node.type === "condition") {
      baseMethod.result = {
        type: "boolean",
        description: "Condition evaluation result"
      };
    }

    return baseMethod;
  }

  private mapNodeTypeToScopes(node: z.infer<typeof WorkflowNodeSchema>): string[] {
    const scopes: string[] = [];

    // Basic scope mapping based on node type and name
    switch (node.type) {
      case "trigger":
        if (node.name.toLowerCase().includes("webhook")) {
          scopes.push("webhook:receive");
        }
        if (node.name.toLowerCase().includes("email")) {
          scopes.push("email:send");
        }
        if (node.name.toLowerCase().includes("file")) {
          scopes.push("read:files");
        }
        break;

      case "action":
        if (node.name.toLowerCase().includes("http") || node.name.toLowerCase().includes("api")) {
          scopes.push("http:request");
        }
        if (node.name.toLowerCase().includes("database") || node.name.toLowerCase().includes("db")) {
          scopes.push("database:read", "database:write");
        }
        if (node.name.toLowerCase().includes("email")) {
          scopes.push("email:send");
        }
        if (node.name.toLowerCase().includes("file")) {
          scopes.push("write:files");
        }
        scopes.push("execute:actions");
        break;

      case "condition":
        scopes.push("read:data");
        break;
    }

    // Add default scopes if none were mapped
    if (scopes.length === 0) {
      scopes.push("read:data");
    }

    return scopes;
  }

  private sanitizeMethodName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "");
  }

  private inferParameterType(value: any): string {
    if (typeof value === "string") return "string";
    if (typeof value === "number") return "number";
    if (typeof value === "boolean") return "boolean";
    if (Array.isArray(value)) return "array";
    if (value !== null && typeof value === "object") return "object";
    return "string"; // default fallback
  }

  private generateMCPServer(workflowName: string): MCPServer {
    return {
      command: "node",
      args: [`./mcp-servers/${this.sanitizeMethodName(workflowName)}-server.js`],
      env: {
        NODE_ENV: "production",
        WORKFLOW_NAME: workflowName
      }
    };
  }

  async mapWorkflowToMCP(workflow: z.infer<typeof WorkflowSchema>): Promise<MCPAgentSpec> {
    // Generate methods from workflow nodes
    const methods: MCPMethod[] = workflow.nodes.map(node => this.mapNodeTypeToMethod(node));

    // Collect all scopes from nodes
    const allScopes = workflow.nodes.flatMap(node => this.mapNodeTypeToScopes(node));
    const uniqueScopes = [...new Set(allScopes)];

    // Validate scopes with mock adapter
    const scopeValidation = await this.mcpAdapter.validateScopes(uniqueScopes);
    if (!scopeValidation.valid) {
      console.warn(`Invalid scopes detected: ${scopeValidation.invalidScopes.join(", ")}`);
    }

    // Filter to only valid scopes
    const validScopes = uniqueScopes.filter(scope => !scopeValidation.invalidScopes.includes(scope));

    // Determine if human loop is needed based on workflow complexity
    const hasHumanLoop = workflow.nodes.some(node => 
      node.type === "action" && 
      (node.name.toLowerCase().includes("approval") || 
       node.name.toLowerCase().includes("review") ||
       node.name.toLowerCase().includes("human"))
    );

    // Generate MCP agent spec
    const mcpSpec: MCPAgentSpec = {
      name: this.sanitizeMethodName(workflow.name),
      description: `MCP agent generated from workflow: ${workflow.name}`,
      version: "1.0.0",
      servers: {
        [this.sanitizeMethodName(workflow.name)]: this.generateMCPServer(workflow.name)
      },
      methods,
      scopes: validScopes,
      humanLoop: hasHumanLoop
    };

    return mcpSpec;
  }
}

// YAML serialization helper
function serializeToYAML(obj: any, indent = 0): string {
  const spaces = "  ".repeat(indent);
  
  if (obj === null || obj === undefined) {
    return "null";
  }
  
  if (typeof obj === "string") {
    // Handle multiline strings and special characters
    if (obj.includes("\n") || obj.includes(":") || obj.includes("-")) {
      return `"${obj.replace(/"/g, '\\"')}"`;
    }
    return obj;
  }
  
  if (typeof obj === "number" || typeof obj === "boolean") {
    return String(obj);
  }
  
  if (Array.isArray(obj)) {
    if (obj.length === 0) {
      return "[]";
    }
    return "\n" + obj.map(item => `${spaces}- ${serializeToYAML(item, indent + 1)}`).join("\n");
  }
  
  if (typeof obj === "object") {
    const entries = Object.entries(obj);
    if (entries.length === 0) {
      return "{}";
    }
    
    return "\n" + entries.map(([key, value]) => {
      const serializedValue = serializeToYAML(value, indent + 1);
      if (serializedValue.startsWith("\n")) {
        return `${spaces}${key}:${serializedValue}`;
      }
      return `${spaces}${key}: ${serializedValue}`;
    }).join("\n");
  }
  
  return String(obj);
}

/**
 * Converts a workflow JSON input to MCP agent specification in YAML format
 * @param json - The workflow JSON string (e.g., from n8n format)
 * @returns Promise<string> - MCP agent spec in YAML format
 * @throws Error if JSON is invalid or workflow validation fails
 */
export async function convertWorkflowToMCP(json: string): Promise<string> {
  try {
    // Parse and validate JSON input
    const rawWorkflow = JSON.parse(json);
    const workflow = WorkflowSchema.parse(rawWorkflow);
    
    // Create mapper and convert workflow
    const mapper = new WorkflowToMCPMapper();
    const mcpSpec = await mapper.mapWorkflowToMCP(workflow);
    
    // Convert to YAML format
    const yamlOutput = `# MCP Agent Specification
# Generated from workflow: ${workflow.name}
# Generated at: ${new Date().toISOString()}

${serializeToYAML(mcpSpec).trim()}`;
    
    return yamlOutput;
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Workflow validation failed: ${error.errors.map(e => `${e.path.join(".")}: ${e.message}`).join(", ")}`);
    }
    
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON input: ${error.message}`);
    }
    
    throw new Error(`Conversion failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Export types for external usage
export type { MCPAgentSpec, MCPMethod, MCPServer };
export { WorkflowSchema, WorkflowNodeSchema };