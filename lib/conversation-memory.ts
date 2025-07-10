// Conversation memory and context management
export interface ConversationContext {
  userId: string;
  accountId: string;
  lastInteractions: Interaction[];
  userGoals: UserGoal[];
  trackedMetrics: TrackedMetric[];
  previousActions: BusinessAction[];
  preferences: UserPreferences;
  businessState: BusinessSnapshot;
  lastUpdated: Date;
}

export interface Interaction {
  id: string;
  timestamp: Date;
  userMessage: string;
  aiResponse: string;
  interactionType: 'query' | 'action' | 'insight' | 'goal_setting';
  widgets: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
}

export interface UserGoal {
  id: string;
  type: 'revenue' | 'growth' | 'efficiency' | 'custom';
  target: number;
  timeframe: string;
  progress: number;
  createdAt: Date;
  status: 'active' | 'achieved' | 'paused';
}

export interface TrackedMetric {
  id: string;
  name: string;
  type: 'revenue' | 'marketing' | 'projects' | 'custom';
  currentValue: number;
  targetValue?: number;
  alertThreshold?: number;
  lastChecked: Date;
}

export interface BusinessAction {
  id: string;
  type: 'increase_budget' | 'create_invoice' | 'update_project' | 'send_email';
  description: string;
  parameters: any;
  result: ActionResult;
  executedAt: Date;
  impact?: string;
}

export interface ActionResult {
  success: boolean;
  message: string;
  data?: any;
  rollbackData?: any;
}

export interface UserPreferences {
  preferredChartTypes: string[];
  defaultTimeRanges: string[];
  notificationSettings: NotificationSettings;
  displaySettings: DisplaySettings;
}

export interface NotificationSettings {
  goalProgress: boolean;
  unusualActivity: boolean;
  actionConfirmations: boolean;
  dailySummary: boolean;
}

export interface DisplaySettings {
  theme: 'light' | 'dark';
  currency: string;
  timezone: string;
  compactMode: boolean;
}

export interface BusinessSnapshot {
  revenue: {
    current: number;
    trend: 'up' | 'down' | 'stable';
    lastUpdated: Date;
  };
  projects: {
    active: number;
    completion_rate: number;
    lastUpdated: Date;
  };
  marketing: {
    roas: number;
    adSpend: number;
    lastUpdated: Date;
  };
}

// In-memory conversation memory with persistence
class ConversationMemory {
  private contexts: Map<string, ConversationContext> = new Map();

  async getContext(userId: string, accountId: string): Promise<ConversationContext> {
    const key = `${userId}-${accountId}`;
    
    // Try memory cache first
    if (this.contexts.has(key)) {
      return this.contexts.get(key)!;
    }

    // Load from storage (Redis/Database)
    const stored = await this.loadFromStorage(userId, accountId);
    if (stored) {
      this.contexts.set(key, stored);
      return stored;
    }

    // Create new context
    const newContext: ConversationContext = {
      userId,
      accountId,
      lastInteractions: [],
      userGoals: [],
      trackedMetrics: [],
      previousActions: [],
      preferences: this.getDefaultPreferences(),
      businessState: {
        revenue: { current: 0, trend: 'stable', lastUpdated: new Date() },
        projects: { active: 0, completion_rate: 0, lastUpdated: new Date() },
        marketing: { roas: 0, adSpend: 0, lastUpdated: new Date() }
      },
      lastUpdated: new Date()
    };

    this.contexts.set(key, newContext);
    return newContext;
  }

  async updateContext(
    userId: string, 
    accountId: string, 
    update: Partial<ConversationContext>
  ): Promise<void> {
    const key = `${userId}-${accountId}`;
    const current = await this.getContext(userId, accountId);
    
    const updated: ConversationContext = {
      ...current,
      ...update,
      lastUpdated: new Date()
    };

    // Update memory cache
    this.contexts.set(key, updated);
    
    // Persist to storage
    await this.saveToStorage(updated);
  }

  async addInteraction(
    userId: string,
    accountId: string,
    userMessage: string,
    aiResponse: string,
    interactionType: Interaction['interactionType'],
    widgets: string[] = []
  ): Promise<void> {
    const context = await this.getContext(userId, accountId);
    
    const interaction: Interaction = {
      id: `interaction-${Date.now()}`,
      timestamp: new Date(),
      userMessage,
      aiResponse,
      interactionType,
      widgets,
      sentiment: this.analyzeSentiment(userMessage)
    };

    // Keep only last 10 interactions
    const lastInteractions = [interaction, ...context.lastInteractions.slice(0, 9)];

    await this.updateContext(userId, accountId, { lastInteractions });
  }

  async addGoal(
    userId: string,
    accountId: string,
    goal: Omit<UserGoal, 'id' | 'createdAt' | 'status'>
  ): Promise<void> {
    const context = await this.getContext(userId, accountId);
    
    const newGoal: UserGoal = {
      ...goal,
      id: `goal-${Date.now()}`,
      createdAt: new Date(),
      status: 'active'
    };

    const userGoals = [...context.userGoals, newGoal];
    await this.updateContext(userId, accountId, { userGoals });
  }

  async updateGoalProgress(
    userId: string,
    accountId: string,
    goalId: string,
    progress: number
  ): Promise<void> {
    const context = await this.getContext(userId, accountId);
    
    const userGoals = context.userGoals.map(goal => 
      goal.id === goalId ? { ...goal, progress } : goal
    );

    await this.updateContext(userId, accountId, { userGoals });
  }

  async addBusinessAction(
    userId: string,
    accountId: string,
    action: Omit<BusinessAction, 'id' | 'executedAt'>
  ): Promise<void> {
    const context = await this.getContext(userId, accountId);
    
    const newAction: BusinessAction = {
      ...action,
      id: `action-${Date.now()}`,
      executedAt: new Date()
    };

    // Keep only last 20 actions
    const previousActions = [newAction, ...context.previousActions.slice(0, 19)];
    await this.updateContext(userId, accountId, { previousActions });
  }

  async updateBusinessState(
    userId: string,
    accountId: string,
    businessState: Partial<BusinessSnapshot>
  ): Promise<void> {
    const context = await this.getContext(userId, accountId);
    
    const updatedState: BusinessSnapshot = {
      ...context.businessState,
      ...businessState
    };

    await this.updateContext(userId, accountId, { businessState: updatedState });
  }

  // Generate contextual system prompt based on conversation history
  generateContextualPrompt(context: ConversationContext): string {
    const recentInteractions = context.lastInteractions.slice(0, 3);
    const activeGoals = context.userGoals.filter(goal => goal.status === 'active');
    const recentActions = context.previousActions.slice(0, 5);

    let prompt = `You are Ozza AI, a business intelligence assistant. Here's what you know about this user:

CONVERSATION CONTEXT:
`;

    if (recentInteractions.length > 0) {
      prompt += `Recent interactions:
${recentInteractions.map(i => `- User: "${i.userMessage}" (${i.interactionType})`).join('\n')}
`;
    }

    if (activeGoals.length > 0) {
      prompt += `
Current goals:
${activeGoals.map(g => `- ${g.type}: ${g.target} (${g.progress}% complete)`).join('\n')}
`;
    }

    if (recentActions.length > 0) {
      prompt += `
Recent actions taken:
${recentActions.map(a => `- ${a.description} (${a.result.success ? 'Success' : 'Failed'})`).join('\n')}
`;
    }

    prompt += `
CURRENT BUSINESS STATE:
- Revenue: ${context.businessState.revenue.current} (trend: ${context.businessState.revenue.trend})
- Active projects: ${context.businessState.projects.active}
- Project completion rate: ${context.businessState.projects.completion_rate}%
- Marketing ROAS: ${context.businessState.marketing.roas}x

INSTRUCTIONS:
- Reference previous conversations naturally
- Track progress toward their stated goals
- Connect current questions to past actions and outcomes
- Provide contextual insights based on their business patterns
- Remember what they care about and check on it proactively
`;

    return prompt;
  }

  private analyzeSentiment(message: string): 'positive' | 'neutral' | 'negative' {
    const positiveWords = ['great', 'excellent', 'good', 'amazing', 'fantastic', 'love', 'perfect'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'worst', 'problem', 'issue'];
    
    const lowerMessage = message.toLowerCase();
    const hasPositive = positiveWords.some(word => lowerMessage.includes(word));
    const hasNegative = negativeWords.some(word => lowerMessage.includes(word));
    
    if (hasPositive && !hasNegative) return 'positive';
    if (hasNegative && !hasPositive) return 'negative';
    return 'neutral';
  }

  private getDefaultPreferences(): UserPreferences {
    return {
      preferredChartTypes: ['line', 'bar', 'area'],
      defaultTimeRanges: ['7d', '30d', '90d'],
      notificationSettings: {
        goalProgress: true,
        unusualActivity: true,
        actionConfirmations: true,
        dailySummary: false
      },
      displaySettings: {
        theme: 'dark',
        currency: 'USD',
        timezone: 'UTC',
        compactMode: false
      }
    };
  }

  private async loadFromStorage(userId: string, accountId: string): Promise<ConversationContext | null> {
    // This would integrate with Redis or database
    // For now, return null to always create fresh context
    return null;
  }

  private async saveToStorage(context: ConversationContext): Promise<void> {
    // This would persist to Redis/database
    // For now, just keep in memory
    console.log('Saving context to storage:', context.userId);
  }
}

// Export singleton instance
export const conversationMemory = new ConversationMemory();