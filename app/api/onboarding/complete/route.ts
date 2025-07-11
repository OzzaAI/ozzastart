import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user_settings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { authClient } from '@/lib/auth-client';

export async function POST(request: NextRequest) {
  try {
    const sessionResponse = await authClient.getSession();
    if (!sessionResponse?.data?.session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = sessionResponse.data.session.userId;
    const body = await request.json();
    const { step = 0, completed = true } = body;

    // Check if user settings exist
    const existingSettings = await db
      .select()
      .from(user_settings)
      .where(eq(user_settings.userId, userId))
      .limit(1);

    const settingsData = {
      userId,
      hasCompletedOnboarding: completed,
      onboardingStep: step,
      updatedAt: new Date()
    };

    let result;
    if (existingSettings.length > 0) {
      result = await db
        .update(user_settings)
        .set(settingsData)
        .where(eq(user_settings.userId, userId))
        .returning();
    } else {
      result = await db
        .insert(user_settings)
        .values({
          ...settingsData,
          createdAt: new Date()
        })
        .returning();
    }

    return NextResponse.json({ 
      success: true, 
      hasCompletedOnboarding: completed,
      onboardingStep: step 
    });
  } catch (error) {
    console.error('Error updating onboarding status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const sessionResponse = await authClient.getSession();
    if (!sessionResponse?.data?.session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = sessionResponse.data.session.userId;
    
    const settings = await db
      .select({
        hasCompletedOnboarding: user_settings.hasCompletedOnboarding,
        onboardingStep: user_settings.onboardingStep
      })
      .from(user_settings)
      .where(eq(user_settings.userId, userId))
      .limit(1);

    if (settings.length === 0) {
      return NextResponse.json({
        hasCompletedOnboarding: false,
        onboardingStep: 0
      });
    }

    return NextResponse.json(settings[0]);
  } catch (error) {
    console.error('Error fetching onboarding status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
