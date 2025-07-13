import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { db } from '@/db/drizzle';
import { ozza_accounts, ozza_account_members, projects } from '@/db/schema';
import { eq, and, desc, count } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getBusinessMetrics, generateBusinessInsights, formatBusinessSummary } from '@/lib/business-intelligence';
import { getBusinessIntelligence } from '@/lib/business-intelligence-enhanced';
import { conversationMemory } from '@/lib/conversation-memory';
import { actionExecutor, actionTemplates } from '@/lib/action-executor';

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic';

// Business Intelligence Functions
async function getBusinessData(userId: string, userRole: string) {
  try {
    // Get user's accounts and projects based on role
    let businessData: Record<string, unknown> = {};

    if (userRole === 'coach') {
      // Coach: Get agencies and their performance
      const coachAccounts = await db.query.ozza_accounts.findMany({
        where: eq(ozza_accounts.owner_id, userId),
        with: {
          members: {
            with: {
              user: true
            }
          }
        }
      });

      const totalProjects = await db
        .select({ count: count() })
        .from(projects)
        .where(eq(projects.client_account_id, coachAccounts[0]?.id || ''));

      businessData = {
        type: 'coach',
        accounts: coachAccounts.length,
        totalProjects: totalProjects[0]?.count || 0,
        agencies: (coachAccounts || []).map(acc => ({
          name: acc.name,
          memberCount: acc.members.length
        }))
      };
    } else if (userRole === 'agency') {
      // Agency: Get client projects and performance
      const userMemberships = await db.query.ozza_account_members.findMany({
        where: eq(ozza_account_members.user_id, userId),
        with: {
          account: true
        }
      });

      const agencyAccount = userMemberships[0]?.account;

      if (agencyAccount) {
        const clientProjects = await db
          .select()
          .from(projects)
          .where(eq(projects.agency_account_id, agencyAccount.id))
          .orderBy(desc(projects.created_at))
          .limit(10);

        const totalProjectsCount = await db
          .select({ count: count() })
          .from(projects)
          .where(eq(projects.agency_account_id, agencyAccount.id));

        const completedProjectsCount = await db
          .select({ count: count() })
          .from(projects)
          .where(and(
            eq(projects.agency_account_id, agencyAccount.id),
            eq(projects.status, 'completed')
          ));

        businessData = {
          type: 'agency',
          agencyName: agencyAccount.name,
          totalProjects: totalProjectsCount[0]?.count || 0,
          completedProjects: completedProjectsCount[0]?.count || 0,
          activeProjects: (clientProjects || []).filter(p => p.status === 'active').length,
          recentProjects: (clientProjects || []).map(p => ({
            name: p.name,
            status: p.status,
            budget: p.budget ? p.budget / 100 : 0, // Convert cents to dollars
            startDate: p.start_date,
            dueDate: p.due_date
          }))
        };
      }
    } else if (userRole === 'client') {
      // Client: Get their projects and status
      const userMemberships = await db.query.ozza_account_members.findMany({
        where: eq(ozza_account_members.user_id, userId),
        with: {
          account: true
        }
      });

      const clientAccount = userMemberships[0]?.account;

      if (clientAccount) {
        const clientProjects = await db
          .select()
          .from(projects)
          .where(eq(projects.client_account_id, clientAccount.id))
          .orderBy(desc(projects.created_at));

        businessData = {
          type: 'client',
          clientName: clientAccount.name,
          totalProjects: clientProjects.length,
          activeProjects: (clientProjects || []).filter(p => p.status === 'active').length,
          completedProjects: (clientProjects || []).filter(p => p.status === 'completed').length,
          projects: (clientProjects || []).map(p => ({
            name: p.name,
            status: p.status,
            budget: p.budget ? p.budget / 100 : 0,
            startDate: p.start_date,
            dueDate: p.due_date,
            priority: p.priority
          }))
        };
      }
    }

    return businessData;
  } catch (error) {
    console.error('Error fetching business data:', error);
    return { error: 'Unable to fetch business data' };
  }
}

export async function POST(req: Request) {
  try {
    const headersList = headers();
    const session = await auth.api.getSession({
      headers: headersList
    });

    if (!session?.user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { messages } = await req.json();
    const userMessage = messages[messages.length - 1].content;
    const userId = session.user.id;
    const userRole = session.user.role;
    
    // Get user's account ID
    let accountId = '';
    if (userRole === 'coach') {
      const coachAccounts = await db.query.ozza_accounts.findMany({
        where: eq(ozza_accounts.owner_id, userId),
        limit: 1
      });
      accountId = coachAccounts[0]?.id || '';
    } else {
      const userMemberships = await db.query.ozza_account_members.findMany({
        where: eq(ozza_account_members.user_id, userId),
        with: { account: true },
        limit: 1
      });
      accountId = userMemberships[0]?.account?.id || '';
    }

    // Get conversation context and enhanced business intelligence
    const [conversationContext, businessIntelligence] = await Promise.all([
      conversationMemory.getContext(userId, accountId),
      getBusinessIntelligence(accountId, userRole)
    ]);
    
    // Detect if this is an action request
    const actionRequest = await detectActionRequest(userMessage);
    
    // Execute action if detected
    let actionResult = null;
    if (actionRequest) {
      actionResult = await actionExecutor.executeAction(
        actionRequest,
        userId,
        accountId
      );
    }
    
    // Get detailed metrics if we have an account
    let metrics = null;
    
    const businessData = await getBusinessData(userId, userRole);
    
    if (businessData && !businessData.error) {
      try {
        // Get user's account ID based on role
        let accountId = '';
        if (session.user.role === 'coach' && businessData.agencies?.length > 0) {
          // For coaches, use first agency account for demo
          const userMemberships = await db.query.ozza_account_members.findMany({
            where: eq(ozza_account_members.user_id, session.user.id),
            with: { account: true }
          });
          accountId = userMemberships[0]?.account?.id || '';
        } else if (session.user.role === 'agency' || session.user.role === 'client') {
          const userMemberships = await db.query.ozza_account_members.findMany({
            where: eq(ozza_account_members.user_id, session.user.id),
            with: { account: true }
          });
          accountId = userMemberships[0]?.account?.id || '';
        }

        if (accountId) {
          metrics = await getBusinessMetrics(accountId, session.user.role);
          generateBusinessInsights(metrics, businessData);
          formatBusinessSummary(businessData, metrics);
        }
      } catch (error) {
        console.error('Error fetching business metrics:', error);
      }
    }

    // Generate contextual system prompt based on conversation history
    const systemPrompt = conversationMemory.generateContextualPrompt(conversationContext) + `

CURRENT BUSINESS INTELLIGENCE:
${JSON.stringify(businessIntelligence, null, 2)}

${actionResult ? `RECENT ACTION RESULT:\n${JSON.stringify(actionResult, null, 2)}\n\n` : ''}
INTERACTION GUIDELINES:
- Reference previous conversations naturally ("Since we last talked...")
- Track progress toward stated goals
- Provide specific, actionable recommendations with numbers
- Offer to execute actions when appropriate ("Should I increase your ad budget?")
- Generate insights by connecting data across platforms
- Remember what they care about and follow up proactively
- When showing revenue/marketing data, always include trends and context
- If you recommend an action, explain the expected impact
- Keep responses conversational but data-driven

AVAILABLE ACTIONS:
- increase_ad_budget: Increase advertising spend for campaigns
- set_goal: Help user set and track business goals  
- create_invoice: Generate invoices for clients
- update_project: Change project status or details

Always offer to take actions when relevant, but get confirmation for significant changes.`;

    // Generate AI response
    const result = await streamText({
      model: openai('gpt-4o-mini'),
      system: systemPrompt,
      messages: messages,
    });
    
    // Store interaction in conversation memory (fire and forget)
    conversationMemory.addInteraction(
      userId,
      accountId,
      userMessage,
      '', // Will be filled when response completes
      actionRequest ? 'action' : 'query'
    ).catch(console.error);
    
    // Update business state in context
    conversationMemory.updateBusinessState(userId, accountId, {
      revenue: {
        current: businessIntelligence.revenue.current,
        trend: businessIntelligence.revenue.growth > 5 ? 'up' : 
               businessIntelligence.revenue.growth < -5 ? 'down' : 'stable',
        lastUpdated: new Date()
      },
      projects: {
        active: businessIntelligence.projects.activeProjects,
        completion_rate: businessIntelligence.projects.completionRate,
        lastUpdated: new Date()
      },
      marketing: {
        roas: businessIntelligence.marketing.roas,
        adSpend: businessIntelligence.marketing.adSpend,
        lastUpdated: new Date()
      }
    }).catch(console.error);

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('AI Chat Error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

// Detect if user message is requesting an action
async function detectActionRequest(userMessage: string): Promise<ReturnType<typeof actionTemplates[keyof typeof actionTemplates]> | null> {
  const lowerMessage = userMessage.toLowerCase();
  
  // Budget increase detection
  if (lowerMessage.includes('increase') && (lowerMessage.includes('budget') || lowerMessage.includes('ad') || lowerMessage.includes('spend'))) {
    const amountMatch = userMessage.match(/\$(\d+)/);
    if (amountMatch) {
      const amount = parseInt(amountMatch[1]);
      return actionTemplates.increaseAdBudget(amount);
    }
  }
  
  // Goal setting detection
  if ((lowerMessage.includes('set') || lowerMessage.includes('want to')) && lowerMessage.includes('goal')) {
    const amountMatch = userMessage.match(/\$(\d+)/);
    if (amountMatch) {
      const target = parseInt(amountMatch[1]);
      return actionTemplates.setRevenueGoal(target, 'this month');
    }
  }
  
  // Invoice creation detection
  if (lowerMessage.includes('create') && lowerMessage.includes('invoice')) {
    const amountMatch = userMessage.match(/\$(\d+)/);
    if (amountMatch) {
      const amount = parseInt(amountMatch[1]);
      return actionTemplates.createInvoice('client', amount, 'Services rendered');
    }
  }
  
  return null;
}