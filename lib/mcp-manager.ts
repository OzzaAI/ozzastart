import { db } from "@/db/drizzle";
import { 
  mcp_integrations, 
  workspace_integrations, 
  workspaces,
  token_usage 
} from "@/db/ai-workspace-schema";
import { eq, and, desc, count, sum } from "drizzle-orm";
import { nanoid } from "nanoid";

export type MCPCategory = 'sales' | 'marketing' | 'finance' | 'operations' | 'analytics' | 'communication' | 'automation';
export type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'needs_revision';
export type ReviewTier = 'free' | 'premium' | 'enterprise';

export interface CreateMCPParams {
  name: string;
  description: string;
  developer_id: string;
  developer_account_id?: string;
  mcp_config: any;
  webhook_endpoints?: any;
  api_requirements?: any;
  category: MCPCategory;
  tags?: string[];
  review_tier?: ReviewTier;
}

export interface InstallMCPParams {
  workspace_id: string;
  mcp_integration_id: string;
  installed_by: string;
  configuration?: any;
  api_credentials?: any;
}

export class MCPManager {
  
  /**
   * Submit new MCP integration for review
   */
  static async submitMCP(params: CreateMCPParams) {
    const slug = `${params.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${nanoid(8)}`;
    
    const mcp = await db.insert(mcp_integrations).values({
      name: params.name,
      slug,
      description: params.description,
      developer_id: params.developer_id,
      developer_account_id: params.developer_account_id,
      mcp_config: params.mcp_config,
      webhook_endpoints: params.webhook_endpoints,
      api_requirements: params.api_requirements,
      category: params.category,
      tags: params.tags,
      review_tier: params.review_tier || 'free',
      review_status: 'pending',
    }).returning();
    
    return mcp[0];
  }
  
  /**
   * Get MCP integrations by category or status
   */
  static async getMCPIntegrations(filters?: {
    category?: MCPCategory;
    review_status?: ReviewStatus;
    developer_id?: string;
    approved_only?: boolean;
  }) {
    let whereConditions = [];
    
    if (filters?.category) {
      whereConditions.push(eq(mcp_integrations.category, filters.category));
    }
    
    if (filters?.review_status) {
      whereConditions.push(eq(mcp_integrations.review_status, filters.review_status));
    }
    
    if (filters?.developer_id) {
      whereConditions.push(eq(mcp_integrations.developer_id, filters.developer_id));
    }
    
    if (filters?.approved_only) {
      whereConditions.push(eq(mcp_integrations.review_status, 'approved'));
    }
    
    const mcps = await db.query.mcp_integrations.findMany({
      where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
      with: {
        developer: {
          columns: {
            id: true,
            name: true,
            email: true,
          }
        },
        developer_account: {
          columns: {
            id: true,
            name: true,
          }
        }
      },
      orderBy: [desc(mcp_integrations.created_at)]
    });
    
    return mcps;
  }
  
  /**
   * Review MCP integration (approve/reject)
   */
  static async reviewMCP(
    mcpId: string,
    reviewerId: string,
    status: ReviewStatus,
    notes?: string
  ) {
    const updated = await db.update(mcp_integrations)
      .set({
        review_status: status,
        reviewed_by: reviewerId,
        reviewed_at: new Date(),
        review_notes: notes,
        deployed_at: status === 'approved' ? new Date() : undefined,
        updated_at: new Date(),
      })
      .where(eq(mcp_integrations.id, mcpId))
      .returning();
    
    return updated[0];
  }
  
  /**
   * Install MCP integration to workspace
   */
  static async installMCPToWorkspace(params: InstallMCPParams) {
    // Check if already installed
    const existing = await db.query.workspace_integrations.findFirst({
      where: and(
        eq(workspace_integrations.workspace_id, params.workspace_id),
        eq(workspace_integrations.mcp_integration_id, params.mcp_integration_id)
      )
    });
    
    if (existing) {
      throw new Error('MCP integration already installed in this workspace');
    }
    
    // Install the integration
    const installation = await db.insert(workspace_integrations).values({
      workspace_id: params.workspace_id,
      mcp_integration_id: params.mcp_integration_id,
      installed_by: params.installed_by,
      configuration: params.configuration,
      api_credentials: params.api_credentials,
      status: 'active',
    }).returning();
    
    // Update installation count
    await db.update(mcp_integrations)
      .set({
        total_installations: sql`total_installations + 1`,
        updated_at: new Date(),
      })
      .where(eq(mcp_integrations.id, params.mcp_integration_id));
    
    return installation[0];
  }
  
  /**
   * Get workspace integrations
   */
  static async getWorkspaceIntegrations(workspaceId: string) {
    const integrations = await db.query.workspace_integrations.findMany({
      where: eq(workspace_integrations.workspace_id, workspaceId),
      with: {
        mcp_integration: {
          with: {
            developer: {
              columns: {
                id: true,
                name: true,
              }
            }
          }
        },
        installed_by_user: {
          columns: {
            id: true,
            name: true,
          }
        }
      },
      orderBy: [desc(workspace_integrations.installed_at)]
    });
    
    return integrations;
  }
  
  /**
   * Update workspace integration configuration
   */
  static async updateWorkspaceIntegration(
    workspaceId: string,
    mcpIntegrationId: string,
    updates: {
      configuration?: any;
      api_credentials?: any;
      status?: 'active' | 'inactive' | 'error';
    }
  ) {
    const updated = await db.update(workspace_integrations)
      .set({
        ...updates,
        updated_at: new Date(),
      })
      .where(
        and(
          eq(workspace_integrations.workspace_id, workspaceId),
          eq(workspace_integrations.mcp_integration_id, mcpIntegrationId)
        )
      )
      .returning();
    
    return updated[0];
  }
  
  /**
   * Remove integration from workspace
   */
  static async uninstallMCPFromWorkspace(workspaceId: string, mcpIntegrationId: string) {
    await db.delete(workspace_integrations)
      .where(
        and(
          eq(workspace_integrations.workspace_id, workspaceId),
          eq(workspace_integrations.mcp_integration_id, mcpIntegrationId)
        )
      );
    
    // Update installation count
    await db.update(mcp_integrations)
      .set({
        total_installations: sql`GREATEST(total_installations - 1, 0)`,
        updated_at: new Date(),
      })
      .where(eq(mcp_integrations.id, mcpIntegrationId));
  }
  
  /**
   * Track MCP usage
   */
  static async trackMCPUsage(
    workspaceId: string,
    mcpIntegrationId: string,
    userId: string,
    tokensUsed: number,
    costCents: number
  ) {
    // Update usage count
    await db.update(workspace_integrations)
      .set({
        usage_count: sql`usage_count + 1`,
        last_used: new Date(),
        updated_at: new Date(),
      })
      .where(
        and(
          eq(workspace_integrations.workspace_id, workspaceId),
          eq(workspace_integrations.mcp_integration_id, mcpIntegrationId)
        )
      );
    
    // Track token usage
    await db.insert(token_usage).values({
      workspace_id: workspaceId,
      user_id: userId,
      tokens_consumed: tokensUsed,
      cost_cents: costCents,
      usage_type: 'mcp_call',
      mcp_integration_id: mcpIntegrationId,
    });
  }
  
  /**
   * Get MCP usage analytics
   */
  static async getMCPAnalytics(mcpIntegrationId: string, timeframe?: 'day' | 'week' | 'month') {
    const timeCondition = timeframe ? 
      sql`created_at >= NOW() - INTERVAL '1 ${timeframe}'` : 
      undefined;
    
    // Get usage stats
    const usageStats = await db
      .select({
        total_calls: count(),
        total_tokens: sum(token_usage.tokens_consumed),
        total_cost: sum(token_usage.cost_cents),
      })
      .from(token_usage)
      .where(
        and(
          eq(token_usage.mcp_integration_id, mcpIntegrationId),
          timeCondition
        )
      );
    
    // Get workspace count
    const workspaceCount = await db
      .select({ count: count() })
      .from(workspace_integrations)
      .where(eq(workspace_integrations.mcp_integration_id, mcpIntegrationId));
    
    return {
      usage: usageStats[0],
      active_workspaces: workspaceCount[0].count,
    };
  }
  
  /**
   * Get developer revenue for MCP
   */
  static async getDeveloperRevenue(developerId: string, timeframe?: 'month' | 'quarter' | 'year') {
    // This would calculate revenue based on MCP usage fees
    // Implementation depends on your specific revenue sharing model
    
    const timeCondition = timeframe ? 
      sql`created_at >= NOW() - INTERVAL '1 ${timeframe}'` : 
      undefined;
    
    const revenue = await db
      .select({
        total_revenue_cents: sum(token_usage.cost_cents),
        total_calls: count(),
      })
      .from(token_usage)
      .innerJoin(mcp_integrations, eq(token_usage.mcp_integration_id, mcp_integrations.id))
      .where(
        and(
          eq(mcp_integrations.developer_id, developerId),
          timeCondition
        )
      );
    
    return revenue[0];
  }
  
  /**
   * Get available MCPs for workspace (approved ones not yet installed)
   */
  static async getAvailableMCPsForWorkspace(workspaceId: string) {
    // Get already installed MCPs
    const installedMCPs = await db
      .select({ mcp_integration_id: workspace_integrations.mcp_integration_id })
      .from(workspace_integrations)
      .where(eq(workspace_integrations.workspace_id, workspaceId));
    
    const installedIds = installedMCPs.map(item => item.mcp_integration_id);
    
    // Get approved MCPs not yet installed
    const availableMCPs = await db.query.mcp_integrations.findMany({
      where: and(
        eq(mcp_integrations.review_status, 'approved'),
        installedIds.length > 0 ? 
          sql`${mcp_integrations.id} NOT IN (${installedIds.join(',')})` : 
          undefined
      ),
      with: {
        developer: {
          columns: {
            id: true,
            name: true,
          }
        }
      },
      orderBy: [desc(mcp_integrations.total_installations)]
    });
    
    return availableMCPs;
  }
}

// Import sql for the methods that use it
import { sql } from "drizzle-orm";
