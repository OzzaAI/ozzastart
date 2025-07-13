import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db/drizzle";
import { user_settings } from "@/db/schema";

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic';

// Validation schemas
const WhiteLabelConfigSchema = z.object({
  logoUrl: z.string().url().optional().or(z.literal("")),
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid hex color").optional(),
  secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid hex color").optional(),
  customDomain: z.string().optional(),
  brandName: z.string().max(100).optional(),
  favicon: z.string().url().optional().or(z.literal("")),
});

const UserSettingsUpdateSchema = z.object({
  whiteLabelConfig: WhiteLabelConfigSchema.optional(),
  preferences: z.record(z.any()).optional(),
  integrations: z.record(z.any()).optional(),
});

// GET - Retrieve user settings
export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Please sign in" },
        { status: 401 }
      );
    }

    // Load user settings
    const [existingSettings] = await db
      .select()
      .from(user_settings)
      .where(eq(user_settings.userId, session.user.id))
      .limit(1);

    if (existingSettings) {
      return NextResponse.json({
        success: true,
        settings: {
          whiteLabelConfig: existingSettings.whiteLabelConfig || {},
          preferences: existingSettings.preferences || {},
          integrations: existingSettings.integrations || {},
          updatedAt: existingSettings.updatedAt,
        },
      });
    }

    // Return default settings if none exist
    return NextResponse.json({
      success: true,
      settings: {
        whiteLabelConfig: {},
        preferences: {},
        integrations: {},
        updatedAt: null,
      },
    });

  } catch (error) {
    console.error("User settings GET error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to retrieve settings",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// POST - Update user settings
export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Please sign in" },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = UserSettingsUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid settings data",
          details: (validationResult.error.errors || []).map(e => `${e.path.join(".")}: ${e.message}`).join(", ") || "Validation failed"
        },
        { status: 400 }
      );
    }

    const { whiteLabelConfig, preferences, integrations } = validationResult.data;

    // Load existing settings
    const [existingSettings] = await db
      .select()
      .from(user_settings)
      .where(eq(user_settings.userId, session.user.id))
      .limit(1);

    const now = new Date();

    if (existingSettings) {
      // Update existing settings
      const updatedSettings = await db
        .update(user_settings)
        .set({
          whiteLabelConfig: whiteLabelConfig ? 
            { ...existingSettings.whiteLabelConfig, ...whiteLabelConfig } : 
            existingSettings.whiteLabelConfig,
          preferences: preferences ? 
            { ...existingSettings.preferences, ...preferences } : 
            existingSettings.preferences,
          integrations: integrations ? 
            { ...existingSettings.integrations, ...integrations } : 
            existingSettings.integrations,
          updatedAt: now,
        })
        .where(eq(user_settings.userId, session.user.id))
        .returning();

      return NextResponse.json({
        success: true,
        message: "Settings updated successfully",
        settings: {
          whiteLabelConfig: updatedSettings[0].whiteLabelConfig,
          preferences: updatedSettings[0].preferences,
          integrations: updatedSettings[0].integrations,
          updatedAt: updatedSettings[0].updatedAt,
        },
      });

    } else {
      // Create new settings
      const newSettings = await db
        .insert(user_settings)
        .values({
          userId: session.user.id,
          whiteLabelConfig: whiteLabelConfig || {},
          preferences: preferences || {},
          integrations: integrations || {},
          updatedAt: now,
        })
        .returning();

      return NextResponse.json({
        success: true,
        message: "Settings created successfully",
        settings: {
          whiteLabelConfig: newSettings[0].whiteLabelConfig,
          preferences: newSettings[0].preferences,
          integrations: newSettings[0].integrations,
          updatedAt: newSettings[0].updatedAt,
        },
      });
    }

  } catch (error) {
    console.error("User settings POST error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update settings",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// PUT - Complete settings replacement (admin use)
export async function PUT(request: NextRequest) {
  try {
    // Authentication check
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Please sign in" },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = UserSettingsUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid settings data",
          details: (validationResult.error.errors || []).map(e => `${e.path.join(".")}: ${e.message}`).join(", ") || "Validation failed"
        },
        { status: 400 }
      );
    }

    const { whiteLabelConfig, preferences, integrations } = validationResult.data;
    const now = new Date();

    // Upsert with complete replacement
    const updatedSettings = await db
      .insert(user_settings)
      .values({
        userId: session.user.id,
        whiteLabelConfig: whiteLabelConfig || {},
        preferences: preferences || {},
        integrations: integrations || {},
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: user_settings.userId,
        set: {
          whiteLabelConfig: whiteLabelConfig || {},
          preferences: preferences || {},
          integrations: integrations || {},
          updatedAt: now,
        },
      })
      .returning();

    return NextResponse.json({
      success: true,
      message: "Settings replaced successfully",
      settings: {
        whiteLabelConfig: updatedSettings[0].whiteLabelConfig,
        preferences: updatedSettings[0].preferences,
        integrations: updatedSettings[0].integrations,
        updatedAt: updatedSettings[0].updatedAt,
      },
    });

  } catch (error) {
    console.error("User settings PUT error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to replace settings",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// DELETE - Reset user settings to defaults
export async function DELETE(request: NextRequest) {
  try {
    // Authentication check
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Please sign in" },
        { status: 401 }
      );
    }

    // Delete user settings
    await db
      .delete(user_settings)
      .where(eq(user_settings.userId, session.user.id));

    return NextResponse.json({
      success: true,
      message: "Settings reset to defaults successfully",
    });

  } catch (error) {
    console.error("User settings DELETE error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to reset settings",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// Export types for external use
export type { WhiteLabelConfigSchema, UserSettingsUpdateSchema };