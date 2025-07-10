import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { WorkspaceManager } from "@/lib/workspace";
import { z } from "zod";

const createWorkspaceSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().optional(),
  subscription_tier: z.enum(["starter", "professional", "enterprise", "enterprise_plus"]),
  business_context: z.object({
    industry: z.string().optional(),
    company_size: z.string().optional(),
    primary_goals: z.array(z.string()).optional(),
  }).optional(),
  owner_id: z.string(),
  agency_account_id: z.string().optional(),
  is_for_client: z.boolean().default(false),
  client_email: z.string().email().optional(),
  client_name: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createWorkspaceSchema.parse(body);

    // Ensure user can only create workspaces for themselves or their clients (if agency)
    if (validatedData.owner_id !== session.user.id && session.user.role !== 'agency') {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Create the workspace
    const workspace = await WorkspaceManager.createWorkspace({
      name: validatedData.name,
      description: validatedData.description,
      owner_id: validatedData.owner_id,
      agency_account_id: validatedData.agency_account_id,
      subscription_tier: validatedData.subscription_tier,
      business_context: validatedData.business_context,
    });

    // If this is for a client, send them an activation email
    if (validatedData.is_for_client && validatedData.client_email) {
      // TODO: Implement client activation email
      // This would send a magic link to the client to activate their workspace
      console.log(`Would send activation email to ${validatedData.client_email} for workspace ${workspace.id}`);
    }

    return NextResponse.json(workspace);
  } catch (error) {
    console.error("Error creating workspace:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const workspaces = await WorkspaceManager.getUserWorkspaces(session.user.id);
    
    return NextResponse.json(workspaces);
  } catch (error) {
    console.error("Error fetching workspaces:", error);
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
