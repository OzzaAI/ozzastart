import { db } from "@/db/drizzle";
import { workspaces, workspace_members, mcp_integrations, workspace_integrations } from "@/db/ai-workspace-schema";
import { user } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { nanoid } from "nanoid";

export type WorkspaceTier = 'starter' | 'professional' | 'enterprise' | 'enterprise_plus';

export interface CreateWorkspaceParams {
  name: string;
  description?: string;
  owner_id: string;
  agency_account_id?: string;
  subscription_tier?: WorkspaceTier;
  business_context?: any;
}

export interface WorkspaceMember {
  id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'user' | 'viewer';
  permissions?: any;
  allowed_integrations?: string[];
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export class WorkspaceManager {
  
  /**
   * Create a new workspace
   */
  static async createWorkspace(params: CreateWorkspaceParams) {
    const slug = `${params.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${nanoid(6)}`;
    
    // Calculate billing period (monthly)
    const billingStart = new Date();
    const billingEnd = new Date();
    billingEnd.setMonth(billingEnd.getMonth() + 1);
    
    // Set token limits based on tier
    const tokenLimits = {
      starter: 100000,
      professional: 300000,
      enterprise: 750000,
      enterprise_plus: -1, // unlimited
    };
    
    const workspace = await db.insert(workspaces).values({
      name: params.name,
      slug,
      description: params.description,
      owner_id: params.owner_id,
      agency_account_id: params.agency_account_id,
      subscription_tier: params.subscription_tier || 'starter',
      token_limit: tokenLimits[params.subscription_tier || 'starter'],
      billing_period_start: billingStart,
      billing_period_end: billingEnd,
      business_context: params.business_context,
    }).returning();
    
    // Add owner as workspace member
    await db.insert(workspace_members).values({
      workspace_id: workspace[0].id,
      user_id: params.owner_id,
      role: 'owner',
      joined_at: new Date(),
    });
    
    return workspace[0];
  }
  
  /**
   * Get workspace by ID with members
   */
  static async getWorkspaceWithMembers(workspaceId: string) {
    const workspace = await db.query.workspaces.findFirst({
      where: eq(workspaces.id, workspaceId),
      with: {
        owner: {
          columns: {
            id: true,
            name: true,
            email: true,
          }
        },
        members: {
          with: {
            user: {
              columns: {
                id: true,
                name: true,
                email: true,
              }
            }
          }
        },
        integrations: {
          with: {
            mcp_integration: true,
          }
        }
      }
    });
    
    return workspace;
  }
  
  /**
   * Get workspaces for a user
   */
  static async getUserWorkspaces(userId: string) {
    const workspacesList = await db.query.workspace_members.findMany({
      where: eq(workspace_members.user_id, userId),
      with: {
        workspace: {
          with: {
            owner: {
              columns: {
                id: true,
                name: true,
                email: true,
              }
            }
          }
        }
      },
      orderBy: [desc(workspace_members.created_at)]
    });
    
    return workspacesList.map(item => ({
      ...item.workspace,
      member_role: item.role,
      member_permissions: item.permissions,
    }));
  }
  
  /**
   * Add member to workspace
   */
  static async addWorkspaceMember(
    workspaceId: string, 
    userId: string, 
    role: 'admin' | 'user' | 'viewer',
    invitedBy: string,
    permissions?: any,
    allowedIntegrations?: string[]
  ) {
    const member = await db.insert(workspace_members).values({
      workspace_id: workspaceId,
      user_id: userId,
      role,
      permissions,
      allowed_integrations: allowedIntegrations,
      invited_by: invitedBy,
      joined_at: new Date(),
    }).returning();
    
    return member[0];
  }
  
  /**
   * Update workspace member role/permissions
   */
  static async updateWorkspaceMember(
    workspaceId: string,
    userId: string,
    updates: {
      role?: 'admin' | 'user' | 'viewer';
      permissions?: any;
      allowed_integrations?: string[];
    }
  ) {
    const updated = await db.update(workspace_members)
      .set({
        ...updates,
        updated_at: new Date(),
      })
      .where(
        and(
          eq(workspace_members.workspace_id, workspaceId),
          eq(workspace_members.user_id, userId)
        )
      )
      .returning();
    
    return updated[0];
  }
  
  /**
   * Remove member from workspace
   */
  static async removeWorkspaceMember(workspaceId: string, userId: string) {
    await db.delete(workspace_members)
      .where(
        and(
          eq(workspace_members.workspace_id, workspaceId),
          eq(workspace_members.user_id, userId)
        )
      );
  }
  
  /**
   * Check if user has access to workspace
   */
  static async checkWorkspaceAccess(workspaceId: string, userId: string) {
    const member = await db.query.workspace_members.findFirst({
      where: and(
        eq(workspace_members.workspace_id, workspaceId),
        eq(workspace_members.user_id, userId)
      ),
    });
    
    return member;
  }
  
  /**
   * Update workspace settings
   */
  static async updateWorkspace(
    workspaceId: string,
    updates: {
      name?: string;
      description?: string;
      business_context?: any;
      ai_configuration?: any;
      branding?: any;
    }
  ) {
    const updated = await db.update(workspaces)
      .set({
        ...updates,
        updated_at: new Date(),
      })
      .where(eq(workspaces.id, workspaceId))
      .returning();
    
    return updated[0];
  }
  
  /**
   * Update workspace subscription tier
   */
  static async updateWorkspaceTier(workspaceId: string, tier: WorkspaceTier) {
    const tokenLimits = {
      starter: 100000,
      professional: 300000,
      enterprise: 750000,
      enterprise_plus: -1, // unlimited
    };
    
    const updated = await db.update(workspaces)
      .set({
        subscription_tier: tier,
        token_limit: tokenLimits[tier],
        updated_at: new Date(),
      })
      .where(eq(workspaces.id, workspaceId))
      .returning();
    
    return updated[0];
  }
  
  /**
   * Track token usage
   */
  static async trackTokenUsage(
    workspaceId: string,
    userId: string,
    tokensUsed: number,
    costCents: number,
    usageType: 'chat' | 'mcp_call' | 'automation',
    conversationId?: string,
    mcpIntegrationId?: string
  ) {
    // Insert usage record
    await db.insert(token_usage).values({
      workspace_id: workspaceId,
      user_id: userId,
      tokens_consumed: tokensUsed,
      cost_cents: costCents,
      usage_type: usageType,
      conversation_id: conversationId,
      mcp_integration_id: mcpIntegrationId,
    });
    
    // Update workspace token counter
    await db.update(workspaces)
      .set({
        tokens_used_current_period: sql`tokens_used_current_period + ${tokensUsed}`,
        updated_at: new Date(),
      })
      .where(eq(workspaces.id, workspaceId));
  }
  
  /**
   * Check if workspace has token capacity
   */
  static async checkTokenCapacity(workspaceId: string, requestedTokens: number) {
    const workspace = await db.query.workspaces.findFirst({
      where: eq(workspaces.id, workspaceId),
      columns: {
        token_limit: true,
        tokens_used_current_period: true,
        subscription_tier: true,
      }
    });
    
    if (!workspace) return false;
    
    // Enterprise plus has unlimited tokens
    if (workspace.subscription_tier === 'enterprise_plus') return true;
    
    const remainingTokens = workspace.token_limit - workspace.tokens_used_current_period;
    return remainingTokens >= requestedTokens;
  }
}

// Import sql for the trackTokenUsage method
import { sql } from "drizzle-orm";
import { token_usage } from "@/db/ai-workspace-schema";
