import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq, desc, sql, count } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db/drizzle";
import { agents, user, shares } from "@/db/schema";
import { canPerformAction, recordUsage } from "@/lib/subscription";

// GET - Retrieve marketplace data
export async function GET(request: NextRequest) {
  try {
    // Authentication check (optional for marketplace browsing)
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    // Fetch all agents with user information
    const allAgents = await db
      .select({
        id: agents.id,
        name: agents.name,
        spec: agents.spec,
        userId: agents.userId,
        userName: user.name,
        createdAt: agents.createdAt,
      })
      .from(agents)
      .leftJoin(user, eq(agents.userId, user.id))
      .orderBy(desc(agents.createdAt));

    // Fetch share counts for each agent
    const sharesCounts = await db
      .select({
        agentId: shares.agentId,
        shareCount: count(shares.id).as("shareCount"),
      })
      .from(shares)
      .groupBy(shares.agentId);

    // Create a map for quick lookup of share counts
    const sharesMap = new Map(
      sharesCounts.map(item => [item.agentId, Number(item.shareCount)])
    );

    // Enhance agents with additional marketplace data
    const enhancedAgents = allAgents.map(agent => {
      // Extract description from spec YAML
      const specLines = agent.spec.split('\n');
      const descLine = specLines.find(line => line.trim().startsWith('description:'));
      const description = descLine 
        ? descLine.replace('description:', '').trim()
        : 'AI-powered automation agent';

      // Extract category from spec or derive from name
      const categoryLine = specLines.find(line => line.trim().startsWith('category:'));
      let category = categoryLine 
        ? categoryLine.replace('category:', '').trim()
        : 'other';

      // Auto-categorize based on name if not specified
      if (category === 'other') {
        const name = agent.name.toLowerCase();
        if (name.includes('email') || name.includes('automation')) category = 'automation';
        else if (name.includes('analytics') || name.includes('dashboard')) category = 'analytics';
        else if (name.includes('lead') || name.includes('marketing')) category = 'marketing';
        else if (name.includes('chat') || name.includes('communication')) category = 'communication';
        else if (name.includes('productivity') || name.includes('task')) category = 'productivity';
      }

      return {
        ...agent,
        description,
        category,
        downloads: Math.floor(Math.random() * 300) + 50, // Mock downloads for now
        rating: Number((Math.random() * 1.5 + 3.5).toFixed(1)), // 3.5-5.0 rating
        price: Math.floor(Math.random() * 5000) + 1000, // $10-$60 in cents
        shares: sharesMap.get(agent.id) || 0,
      };
    });

    // Calculate marketplace stats
    const totalAgents = enhancedAgents.length;
    const totalDownloads = enhancedAgents.reduce((sum, agent) => sum + agent.downloads, 0);
    const totalShares = enhancedAgents.reduce((sum, agent) => sum + agent.shares, 0);
    const revenue = enhancedAgents.reduce((sum, agent) => sum + (agent.price * agent.downloads * 0.1), 0); // 10% commission

    const stats = {
      totalAgents,
      totalDownloads,
      totalShares,
      revenue: Math.floor(revenue),
    };

    return NextResponse.json({
      success: true,
      agents: enhancedAgents,
      stats,
    });

  } catch (error) {
    console.error("Marketplace API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to load marketplace data",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// POST - Add agent to marketplace (share/publish)
export async function POST(request: NextRequest) {
  try {
    // Authentication required for posting
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
    const { agentId, platform, generateReferralLink } = body;

    if (!agentId || !platform) {
      return NextResponse.json(
        { success: false, error: "Agent ID and platform are required" },
        { status: 400 }
      );
    }

    // Verify agent exists and belongs to user
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

    if (agent.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "You can only share your own agents" },
        { status: 403 }
      );
    }

    // Generate referral link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const referralCode = `${session.user.id}-${agentId}-${Date.now()}`;
    const referralLink = `${baseUrl}/marketplace/agent/${agentId}?ref=${referralCode}`;

    // Save share record
    const [newShare] = await db
      .insert(shares)
      .values({
        userId: session.user.id,
        agentId: agentId,
        platform: platform,
        link: referralLink,
      })
      .returning();

    return NextResponse.json({
      success: true,
      message: "Agent shared successfully",
      share: {
        id: newShare.id,
        platform: newShare.platform,
        link: newShare.link,
        createdAt: newShare.createdAt,
      },
    });

  } catch (error) {
    console.error("Marketplace POST error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to share agent",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// PUT - Update agent marketplace settings
export async function PUT(request: NextRequest) {
  try {
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
    const { agentId, price, description, category, isPublic } = body;

    if (!agentId) {
      return NextResponse.json(
        { success: false, error: "Agent ID is required" },
        { status: 400 }
      );
    }

    // Verify agent exists and belongs to user
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

    if (agent.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "You can only update your own agents" },
        { status: 403 }
      );
    }

    // Update spec with marketplace metadata
    let updatedSpec = agent.spec;
    
    if (description) {
      const lines = updatedSpec.split('\n');
      const descIndex = lines.findIndex(line => line.trim().startsWith('description:'));
      if (descIndex >= 0) {
        lines[descIndex] = `description: ${description}`;
      } else {
        lines.splice(1, 0, `description: ${description}`);
      }
      updatedSpec = lines.join('\n');
    }

    if (category) {
      const lines = updatedSpec.split('\n');
      const catIndex = lines.findIndex(line => line.trim().startsWith('category:'));
      if (catIndex >= 0) {
        lines[catIndex] = `category: ${category}`;
      } else {
        lines.push(`category: ${category}`);
      }
      updatedSpec = lines.join('\n');
    }

    // Update agent in database
    const [updatedAgent] = await db
      .update(agents)
      .set({ spec: updatedSpec })
      .where(eq(agents.id, agentId))
      .returning();

    return NextResponse.json({
      success: true,
      message: "Agent updated successfully",
      agent: updatedAgent,
    });

  } catch (error) {
    console.error("Marketplace PUT error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update agent",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function DELETE() {
  return NextResponse.json(
    { success: false, error: "Method not allowed" },
    { status: 405 }
  );
}