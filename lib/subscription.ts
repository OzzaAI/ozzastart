import { auth } from "@/lib/auth";
import { db } from "@/db/drizzle";
import { subscription } from "@/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

export type SubscriptionDetails = {
  id: string;
  productId: string;
  status: string;
  amount: number;
  currency: string;
  recurringInterval: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt: Date | null;
  organizationId: string | null;
};

export type SubscriptionDetailsResult = {
  hasSubscription: boolean;
  subscription?: SubscriptionDetails;
  error?: string;
  errorType?: "CANCELED" | "EXPIRED" | "GENERAL";
};

export async function getSubscriptionDetails(): Promise<SubscriptionDetailsResult> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { hasSubscription: false };
    }

    const userSubscriptions = await db
      .select()
      .from(subscription)
      .where(eq(subscription.userId, session.user.id));

    if (!userSubscriptions.length) {
      return { hasSubscription: false };
    }

    // Get the most recent active subscription
    const activeSubscription = userSubscriptions
      .filter((sub) => sub.status === "active")
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

    if (!activeSubscription) {
      // Check for canceled or expired subscriptions
      const latestSubscription = userSubscriptions
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

      if (latestSubscription) {
        const now = new Date();
        const isExpired = new Date(latestSubscription.currentPeriodEnd) < now;
        const isCanceled = latestSubscription.status === "canceled";

        return {
          hasSubscription: true,
          subscription: {
            id: latestSubscription.id,
            productId: latestSubscription.productId,
            status: latestSubscription.status,
            amount: latestSubscription.amount,
            currency: latestSubscription.currency,
            recurringInterval: latestSubscription.recurringInterval,
            currentPeriodStart: latestSubscription.currentPeriodStart,
            currentPeriodEnd: latestSubscription.currentPeriodEnd,
            cancelAtPeriodEnd: latestSubscription.cancelAtPeriodEnd,
            canceledAt: latestSubscription.canceledAt,
            organizationId: null,
          },
          error: isCanceled ? "Subscription has been canceled" : isExpired ? "Subscription has expired" : "Subscription is not active",
          errorType: isCanceled ? "CANCELED" : isExpired ? "EXPIRED" : "GENERAL",
        };
      }

      return { hasSubscription: false };
    }

    return {
      hasSubscription: true,
      subscription: {
        id: activeSubscription.id,
        productId: activeSubscription.productId,
        status: activeSubscription.status,
        amount: activeSubscription.amount,
        currency: activeSubscription.currency,
        recurringInterval: activeSubscription.recurringInterval,
        currentPeriodStart: activeSubscription.currentPeriodStart,
        currentPeriodEnd: activeSubscription.currentPeriodEnd,
        cancelAtPeriodEnd: activeSubscription.cancelAtPeriodEnd,
        canceledAt: activeSubscription.canceledAt,
        organizationId: null,
      },
    };
  } catch (error) {
    console.error("Error fetching subscription details:", error);
    return {
      hasSubscription: false,
      error: "Failed to load subscription details",
      errorType: "GENERAL",
    };
  }
}

// Simple helper to check if user has an active subscription
export async function isUserSubscribed(): Promise<boolean> {
  const result = await getSubscriptionDetails();
  return result.hasSubscription && result.subscription?.status === "active";
}

// Helper to check if user has access to a specific product/tier
export async function hasAccessToProduct(productId: string): Promise<boolean> {
  const result = await getSubscriptionDetails();
  return (
    result.hasSubscription &&
    result.subscription?.status === "active" &&
    result.subscription?.productId === productId
  );
}

// Helper to get user's current subscription status
export async function getUserSubscriptionStatus(): Promise<"active" | "canceled" | "expired" | "none"> {
  const result = await getSubscriptionDetails();
  
  if (!result.hasSubscription) {
    return "none";
  }
  
  if (result.subscription?.status === "active") {
    return "active";
  }
  
  if (result.errorType === "CANCELED") {
    return "canceled";
  }
  
  if (result.errorType === "EXPIRED") {
    return "expired";
  }
  
  return "none";
}

// Usage-based billing types
export type UsageRecord = {
  userId: string;
  agentId: string;
  action: "download" | "share" | "execution" | "api_call";
  amount: number; // Cost in cents
  metadata?: Record<string, any>;
};

export type BillingPlan = {
  id: string;
  name: string;
  basePrice: number; // Monthly base price in cents
  features: {
    agentDownloads: {
      included: number;
      pricePerExtra: number; // cents per download
    };
    agentShares: {
      included: number;
      pricePerExtra: number; // cents per share
    };
    apiCalls: {
      included: number;
      pricePerExtra: number; // cents per 1000 calls
    };
  };
};

// Predefined billing plans
export const BILLING_PLANS: Record<string, BillingPlan> = {
  "free": {
    id: "free",
    name: "Free",
    basePrice: 0,
    features: {
      agentDownloads: { included: 5, pricePerExtra: 50 }, // $0.50 per extra download
      agentShares: { included: 10, pricePerExtra: 10 }, // $0.10 per extra share
      apiCalls: { included: 1000, pricePerExtra: 500 }, // $5.00 per 1000 extra calls
    }
  },
  "pro": {
    id: "pro",
    name: "Pro",
    basePrice: 2900, // $29/month
    features: {
      agentDownloads: { included: 50, pricePerExtra: 25 }, // $0.25 per extra download
      agentShares: { included: 100, pricePerExtra: 5 }, // $0.05 per extra share
      apiCalls: { included: 10000, pricePerExtra: 300 }, // $3.00 per 1000 extra calls
    }
  },
  "enterprise": {
    id: "enterprise", 
    name: "Enterprise",
    basePrice: 9900, // $99/month
    features: {
      agentDownloads: { included: 500, pricePerExtra: 10 }, // $0.10 per extra download
      agentShares: { included: 1000, pricePerExtra: 2 }, // $0.02 per extra share
      apiCalls: { included: 100000, pricePerExtra: 200 }, // $2.00 per 1000 extra calls
    }
  }
};

// Usage tracking functions
export async function recordUsage(usage: UsageRecord): Promise<void> {
  try {
    // In a real implementation, this would:
    // 1. Store usage in a dedicated usage_records table
    // 2. Aggregate usage for billing periods
    // 3. Trigger billing when limits are exceeded
    
    console.log("Usage recorded:", usage);
    
    // For now, just log the usage
    // TODO: Implement actual usage tracking with database storage
    
  } catch (error) {
    console.error("Failed to record usage:", error);
  }
}

export async function getUserUsageThisMonth(userId: string): Promise<{
  agentDownloads: number;
  agentShares: number;
  apiCalls: number;
  totalCost: number;
}> {
  try {
    // Mock usage data - in production this would query usage_records table
    // filtered by userId and current billing period
    
    return {
      agentDownloads: Math.floor(Math.random() * 25) + 5,
      agentShares: Math.floor(Math.random() * 50) + 10,
      apiCalls: Math.floor(Math.random() * 5000) + 1000,
      totalCost: Math.floor(Math.random() * 2000) + 500, // $5-25 in cents
    };
    
  } catch (error) {
    console.error("Failed to get user usage:", error);
    return {
      agentDownloads: 0,
      agentShares: 0,
      apiCalls: 0,
      totalCost: 0,
    };
  }
}

export async function calculateOverageCharges(userId: string, planId: string = "free"): Promise<{
  downloads: { overage: number; cost: number };
  shares: { overage: number; cost: number };
  apiCalls: { overage: number; cost: number };
  totalOverage: number;
}> {
  const plan = BILLING_PLANS[planId];
  const usage = await getUserUsageThisMonth(userId);
  
  const downloadOverage = Math.max(0, usage.agentDownloads - plan.features.agentDownloads.included);
  const shareOverage = Math.max(0, usage.agentShares - plan.features.agentShares.included);
  const apiCallOverage = Math.max(0, usage.apiCalls - plan.features.apiCalls.included);
  
  const downloadCost = downloadOverage * plan.features.agentDownloads.pricePerExtra;
  const shareCost = shareOverage * plan.features.agentShares.pricePerExtra;
  const apiCallCost = Math.ceil(apiCallOverage / 1000) * plan.features.apiCalls.pricePerExtra;
  
  return {
    downloads: { overage: downloadOverage, cost: downloadCost },
    shares: { overage: shareOverage, cost: shareCost },
    apiCalls: { overage: apiCallOverage, cost: apiCallCost },
    totalOverage: downloadCost + shareCost + apiCallCost,
  };
}

// Check if user can perform an action without exceeding plan limits
export async function canPerformAction(
  userId: string, 
  action: "download" | "share" | "api_call",
  planId: string = "free"
): Promise<{ allowed: boolean; willIncurCharge: boolean; estimatedCost: number }> {
  const plan = BILLING_PLANS[planId];
  const usage = await getUserUsageThisMonth(userId);
  
  let currentUsage: number;
  let includedLimit: number;
  let pricePerExtra: number;
  
  switch (action) {
    case "download":
      currentUsage = usage.agentDownloads;
      includedLimit = plan.features.agentDownloads.included;
      pricePerExtra = plan.features.agentDownloads.pricePerExtra;
      break;
    case "share":
      currentUsage = usage.agentShares;
      includedLimit = plan.features.agentShares.included;
      pricePerExtra = plan.features.agentShares.pricePerExtra;
      break;
    case "api_call":
      currentUsage = usage.apiCalls;
      includedLimit = plan.features.apiCalls.included;
      pricePerExtra = plan.features.apiCalls.pricePerExtra;
      break;
    default:
      return { allowed: false, willIncurCharge: false, estimatedCost: 0 };
  }
  
  const willExceedLimit = currentUsage >= includedLimit;
  const estimatedCost = willExceedLimit ? pricePerExtra : 0;
  
  return {
    allowed: true, // Always allow for now, just track usage
    willIncurCharge: willExceedLimit,
    estimatedCost,
  };
}

// Generate invoice for usage overage
export async function generateUsageInvoice(userId: string, planId: string = "free"): Promise<{
  invoiceId: string;
  baseAmount: number;
  overageAmount: number;
  totalAmount: number;
  dueDate: Date;
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }>;
}> {
  const plan = BILLING_PLANS[planId];
  const overages = await calculateOverageCharges(userId, planId);
  
  const lineItems = [];
  
  if (overages.downloads.overage > 0) {
    lineItems.push({
      description: `Agent Downloads (${overages.downloads.overage} over limit)`,
      quantity: overages.downloads.overage,
      unitPrice: plan.features.agentDownloads.pricePerExtra,
      amount: overages.downloads.cost,
    });
  }
  
  if (overages.shares.overage > 0) {
    lineItems.push({
      description: `Agent Shares (${overages.shares.overage} over limit)`,
      quantity: overages.shares.overage,
      unitPrice: plan.features.agentShares.pricePerExtra,
      amount: overages.shares.cost,
    });
  }
  
  if (overages.apiCalls.overage > 0) {
    const overage1k = Math.ceil(overages.apiCalls.overage / 1000);
    lineItems.push({
      description: `API Calls (${overage1k}k over limit)`,
      quantity: overage1k,
      unitPrice: plan.features.apiCalls.pricePerExtra,
      amount: overages.apiCalls.cost,
    });
  }
  
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30); // 30 days from now
  
  return {
    invoiceId: `INV-${Date.now()}-${userId.slice(-6)}`,
    baseAmount: plan.basePrice,
    overageAmount: overages.totalOverage,
    totalAmount: plan.basePrice + overages.totalOverage,
    dueDate,
    lineItems,
  };
}

// Grok Heavy Tier Access Functions
export async function hasGrokHeavyTierAccess(): Promise<boolean> {
  try {
    const result = await getSubscriptionDetails();
    
    // Check if user has active Grok Heavy subscription
    if (result.hasSubscription && 
        result.subscription?.status === "active" && 
        result.subscription?.productId === "grok_heavy") {
      return true;
    }
    
    // Also check for enterprise tier as it includes Heavy features
    if (result.hasSubscription && 
        result.subscription?.status === "active" && 
        result.subscription?.productId === "enterprise") {
      return true;
    }
    
    return false;
  } catch (error) {
    console.error("Error checking Grok Heavy tier access:", error);
    return false;
  }
}

export async function getGrokTierInfo(): Promise<{
  tier: "free" | "pro" | "enterprise" | "grok_heavy";
  hasHeavyAccess: boolean;
  multiAgentEnabled: boolean;
  contextLimit: string;
  parallelProcessing: boolean;
}> {
  try {
    const result = await getSubscriptionDetails();
    
    if (!result.hasSubscription || result.subscription?.status !== "active") {
      return {
        tier: "free",
        hasHeavyAccess: false,
        multiAgentEnabled: false,
        contextLimit: "32K tokens",
        parallelProcessing: false,
      };
    }
    
    const productId = result.subscription.productId;
    const isHeavyTier = productId === "grok_heavy" || productId === "enterprise";
    
    return {
      tier: productId as "free" | "pro" | "enterprise" | "grok_heavy",
      hasHeavyAccess: isHeavyTier,
      multiAgentEnabled: isHeavyTier,
      contextLimit: isHeavyTier ? "256K tokens" : "32K tokens",
      parallelProcessing: isHeavyTier,
    };
  } catch (error) {
    console.error("Error getting Grok tier info:", error);
    return {
      tier: "free",
      hasHeavyAccess: false,
      multiAgentEnabled: false,
      contextLimit: "32K tokens",
      parallelProcessing: false,
    };
  }
}

export async function checkGrokModelCompatibility(modelId: string): Promise<{
  compatible: boolean;
  requiredTier?: string;
  message: string;
}> {
  const tierInfo = await getGrokTierInfo();
  
  // Grok 4 requires Heavy tier for full features
  if (modelId === 'grok-4-0709') {
    if (tierInfo.hasHeavyAccess) {
      return {
        compatible: true,
        message: "Grok 4 fully supported with Heavy tier access"
      };
    } else {
      return {
        compatible: false,
        requiredTier: "grok_heavy",
        message: "Grok 4 requires Heavy tier subscription for multi-agent features"
      };
    }
  }
  
  // Legacy models work with any tier
  if (modelId === 'grok-beta') {
    return {
      compatible: true,
      message: "Grok Beta supported on all tiers"
    };
  }
  
  return {
    compatible: false,
    message: `Unknown model: ${modelId}`
  };
}
