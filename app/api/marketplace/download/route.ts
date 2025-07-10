import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db/drizzle";
import { agents } from "@/db/schema";
import { canPerformAction, recordUsage } from "@/lib/subscription";

// POST - Download agent with billing check
export async function POST(request: NextRequest) {
  try {
    // Authentication required
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Please sign in" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { agentId, planId = "free" } = body;

    if (!agentId) {
      return NextResponse.json(
        { success: false, error: "Agent ID is required" },
        { status: 400 }
      );
    }

    // Check if agent exists
    const [agent] = await db
      .select()
      .from(agents)
      .where(eq(agents.id, agentId))
      .limit(1);

    if (!agent) {
      return NextResponse.json(
        { success: false, error: "Agent not found" },
        { status: 404 }
      );
    }

    // Check billing limits
    const billingCheck = await canPerformAction(session.user.id, "download", planId);
    
    if (!billingCheck.allowed) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Download limit reached",
          billingInfo: {
            willIncurCharge: billingCheck.willIncurCharge,
            estimatedCost: billingCheck.estimatedCost,
          }
        },
        { status: 402 } // Payment Required
      );
    }

    // Record usage for billing
    await recordUsage({
      userId: session.user.id,
      agentId: agentId,
      action: "download",
      amount: billingCheck.estimatedCost,
      metadata: {
        agentName: agent.name,
        timestamp: new Date().toISOString(),
        planId,
      }
    });

    // Return agent spec for download
    return NextResponse.json({
      success: true,
      agent: {
        id: agent.id,
        name: agent.name,
        spec: agent.spec,
        downloadedAt: new Date().toISOString(),
      },
      billingInfo: {
        wasCharged: billingCheck.willIncurCharge,
        chargeAmount: billingCheck.estimatedCost,
        message: billingCheck.willIncurCharge 
          ? `Download charged $${(billingCheck.estimatedCost / 100).toFixed(2)} to your account`
          : "Download included in your plan"
      }
    });

  } catch (error) {
    console.error("Download API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to download agent",
        details: error instanceof Error ? error.message : "Unknown error"
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