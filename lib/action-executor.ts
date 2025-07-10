// Business action execution with safeguards and rollback capability
export interface BusinessAction {
  type: 'increase_ad_budget' | 'create_invoice' | 'update_project' | 'send_email' | 'set_goal';
  params: any;
  safeguards: ActionSafeguards;
  confirmationRequired: boolean;
  description: string;
}

export interface ActionSafeguards {
  maxAmount?: number;
  minAmount?: number;
  requiredApprovals?: string[];
  rollbackPlan?: RollbackPlan;
  monitoringRules?: MonitoringRule[];
  timeWindow?: number; // minutes after which action auto-reverts
}

export interface RollbackPlan {
  canRollback: boolean;
  rollbackAction: any;
  rollbackWindow: number; // minutes
}

export interface MonitoringRule {
  metric: string;
  threshold: number;
  condition: 'above' | 'below' | 'equals';
  action: 'alert' | 'pause' | 'rollback';
}

export interface ActionResult {
  success: boolean;
  message: string;
  data?: any;
  rollbackData?: any;
  monitoringId?: string;
}

export interface ActionConfirmation {
  actionId: string;
  description: string;
  params: any;
  expectedImpact: string;
  safeguards: string[];
  approved: boolean;
  timestamp: Date;
}

class ActionExecutor {
  private pendingActions: Map<string, BusinessAction> = new Map();
  private executedActions: Map<string, ActionResult> = new Map();

  async executeAction(
    action: BusinessAction,
    userId: string,
    accountId: string,
    skipConfirmation: boolean = false
  ): Promise<ActionResult> {
    try {
      // 1. Validate safeguards
      const validation = await this.validateSafeguards(action.safeguards, action.params);
      if (!validation.valid) {
        return {
          success: false,
          message: `Action blocked: ${validation.reason}`
        };
      }

      // 2. Get user confirmation if required
      if (action.confirmationRequired && !skipConfirmation) {
        const actionId = await this.requestConfirmation(action, userId);
        return {
          success: true,
          message: `Action queued for confirmation. ID: ${actionId}`,
          data: { actionId, requiresConfirmation: true }
        };
      }

      // 3. Execute with rollback capability
      const result = await this.performActionWithRollback(action, userId, accountId);

      // 4. Set up monitoring if specified
      if (action.safeguards.monitoringRules && result.success) {
        const monitoringId = await this.setupMonitoring(
          action.safeguards.monitoringRules,
          result,
          userId,
          accountId
        );
        result.monitoringId = monitoringId;
      }

      return result;
    } catch (error) {
      console.error('Action execution error:', error);
      return {
        success: false,
        message: `Action failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async confirmAction(actionId: string, approved: boolean): Promise<ActionResult> {
    const action = this.pendingActions.get(actionId);
    if (!action) {
      return {
        success: false,
        message: 'Action not found or already executed'
      };
    }

    if (!approved) {
      this.pendingActions.delete(actionId);
      return {
        success: true,
        message: 'Action cancelled by user'
      };
    }

    // Execute the confirmed action
    this.pendingActions.delete(actionId);
    return await this.executeAction(action, 'user', 'account', true);
  }

  private async validateSafeguards(safeguards: ActionSafeguards, params: any): Promise<{valid: boolean, reason?: string}> {
    // Amount validation
    if (safeguards.maxAmount && params.amount > safeguards.maxAmount) {
      return {
        valid: false,
        reason: `Amount ${params.amount} exceeds maximum allowed ${safeguards.maxAmount}`
      };
    }

    if (safeguards.minAmount && params.amount < safeguards.minAmount) {
      return {
        valid: false,
        reason: `Amount ${params.amount} below minimum required ${safeguards.minAmount}`
      };
    }

    // Time-based validation
    const now = new Date();
    const hour = now.getHours();
    if (hour < 9 || hour > 17) {
      // Require extra confirmation for after-hours actions
      return {
        valid: true,
        reason: 'After-hours action - extra confirmation required'
      };
    }

    return { valid: true };
  }

  private async requestConfirmation(action: BusinessAction, userId: string): Promise<string> {
    const actionId = `confirm-${Date.now()}`;
    
    // Store pending action
    this.pendingActions.set(actionId, action);
    
    // In a real implementation, this would trigger a UI confirmation dialog
    // or send a notification to the user
    console.log(`Confirmation requested for action: ${action.description}`);
    
    return actionId;
  }

  private async performActionWithRollback(
    action: BusinessAction,
    userId: string,
    accountId: string
  ): Promise<ActionResult> {
    // Capture pre-state for rollback
    const rollbackData = await this.capturePreState(action);

    try {
      const result = await this.performAction(action, userId, accountId);
      
      // Store successful action
      this.executedActions.set(`${userId}-${Date.now()}`, {
        ...result,
        rollbackData
      });

      return result;
    } catch (error) {
      // Attempt rollback if action failed
      if (rollbackData && action.safeguards.rollbackPlan?.canRollback) {
        await this.performRollback(rollbackData, action.safeguards.rollbackPlan);
      }
      
      throw error;
    }
  }

  private async performAction(action: BusinessAction, userId: string, accountId: string): Promise<ActionResult> {
    switch (action.type) {
      case 'increase_ad_budget':
        return await this.increaseAdBudget(action.params, userId, accountId);
      
      case 'create_invoice':
        return await this.createInvoice(action.params, userId, accountId);
      
      case 'update_project':
        return await this.updateProject(action.params, userId, accountId);
      
      case 'send_email':
        return await this.sendEmail(action.params, userId, accountId);
        
      case 'set_goal':
        return await this.setGoal(action.params, userId, accountId);

      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  // Action implementations
  private async increaseAdBudget(params: any, userId: string, accountId: string): Promise<ActionResult> {
    // This would integrate with Google Ads API, Facebook Ads API, etc.
    // For MVP, simulate the action
    
    const { amount, campaign } = params;
    const newBudget = 800 + amount; // Current budget + increase
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock success response
    return {
      success: true,
      message: `Successfully increased ${campaign || 'campaign'} budget by $${amount}. New daily budget: $${newBudget}`,
      data: {
        oldBudget: 800,
        newBudget: newBudget,
        campaign: campaign || 'Summer Sale',
        expectedImpact: `Estimated additional revenue: $${amount * 6.2} (based on current 6.2x ROAS)`
      }
    };
  }

  private async createInvoice(params: any, userId: string, accountId: string): Promise<ActionResult> {
    // This would integrate with Stripe, QuickBooks, etc.
    const { clientId, amount, description } = params;
    
    return {
      success: true,
      message: `Invoice created for $${amount}`,
      data: {
        invoiceId: `inv-${Date.now()}`,
        amount,
        client: clientId,
        description,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      }
    };
  }

  private async updateProject(params: any, userId: string, accountId: string): Promise<ActionResult> {
    // This would update the project in your database
    const { projectId, status, notes } = params;
    
    return {
      success: true,
      message: `Project ${projectId} updated to ${status}`,
      data: {
        projectId,
        oldStatus: 'active',
        newStatus: status,
        notes,
        updatedAt: new Date()
      }
    };
  }

  private async sendEmail(params: any, userId: string, accountId: string): Promise<ActionResult> {
    // This would integrate with email service
    const { to, subject, body } = params;
    
    return {
      success: true,
      message: `Email sent to ${to}`,
      data: {
        messageId: `msg-${Date.now()}`,
        to,
        subject,
        sentAt: new Date()
      }
    };
  }

  private async setGoal(params: any, userId: string, accountId: string): Promise<ActionResult> {
    // This would integrate with your conversation memory system
    const { type, target, timeframe } = params;
    
    return {
      success: true,
      message: `Goal set: ${type} target of ${target} within ${timeframe}`,
      data: {
        goalId: `goal-${Date.now()}`,
        type,
        target,
        timeframe,
        createdAt: new Date()
      }
    };
  }

  private async capturePreState(action: BusinessAction): Promise<any> {
    // Capture current state for rollback
    switch (action.type) {
      case 'increase_ad_budget':
        return {
          currentBudget: 800,
          campaign: action.params.campaign
        };
      default:
        return null;
    }
  }

  private async performRollback(rollbackData: any, rollbackPlan: RollbackPlan): Promise<void> {
    // Implement rollback logic
    console.log('Performing rollback:', rollbackData);
  }

  private async setupMonitoring(
    rules: MonitoringRule[],
    result: ActionResult,
    userId: string,
    accountId: string
  ): Promise<string> {
    const monitoringId = `monitor-${Date.now()}`;
    
    // Set up monitoring rules (would run in background)
    rules.forEach(rule => {
      console.log(`Setting up monitoring for ${rule.metric}: ${rule.condition} ${rule.threshold}`);
    });
    
    return monitoringId;
  }
}

// Predefined action templates for common business actions
export const actionTemplates = {
  increaseAdBudget: (amount: number, campaign?: string): BusinessAction => ({
    type: 'increase_ad_budget',
    params: { amount, campaign },
    confirmationRequired: amount > 200,
    description: `Increase ad budget by $${amount}${campaign ? ` for ${campaign}` : ''}`,
    safeguards: {
      maxAmount: 1000,
      minAmount: 50,
      monitoringRules: [
        {
          metric: 'roas',
          threshold: 3.0,
          condition: 'below',
          action: 'alert'
        }
      ]
    }
  }),

  setRevenueGoal: (target: number, timeframe: string): BusinessAction => ({
    type: 'set_goal',
    params: { type: 'revenue', target, timeframe },
    confirmationRequired: false,
    description: `Set revenue goal of $${target} for ${timeframe}`,
    safeguards: {}
  }),

  createInvoice: (clientId: string, amount: number, description: string): BusinessAction => ({
    type: 'create_invoice',
    params: { clientId, amount, description },
    confirmationRequired: amount > 1000,
    description: `Create invoice for $${amount}`,
    safeguards: {
      maxAmount: 10000
    }
  })
};

// Export singleton instance
export const actionExecutor = new ActionExecutor();