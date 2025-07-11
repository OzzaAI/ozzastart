import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { integrations } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { authClient } from '@/lib/auth-client';
import { getSubscriptionStatus } from '@/lib/subscription';
import { nanoid } from 'nanoid';

export async function POST(request: NextRequest) {
  try {
    const sessionResponse = await authClient.getSession();
    if (!sessionResponse?.data?.session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = sessionResponse.data.session.userId;
    const body = await request.json();
    const { regenerate = false, integrationId } = body;
    
    // Check subscription for advanced integrations
    const subscription = await getSubscriptionStatus(userId);
    const isPremium = subscription?.status === 'active';
    
    if (regenerate && integrationId) {
      // Regenerate existing API key
      const newApiKey = `ozza_${nanoid(32)}`;
      
      const result = await db
        .update(integrations)
        .set({
          apiKey: newApiKey,
          updatedAt: new Date()
        })
        .where(eq(integrations.id, integrationId))
        .returning();

      if (result.length === 0) {
        return NextResponse.json({ error: 'Integration not found' }, { status: 404 });
      }

      return NextResponse.json({
        apiKey: newApiKey,
        message: 'API key regenerated successfully'
      });
    } else {
      // Generate new API key and create integration
      // Check existing integrations count for free users
      if (!isPremium) {
        const existingCount = await db
          .select({ count: integrations.id })
          .from(integrations)
          .where(eq(integrations.userId, userId));
        
        if (existingCount.length >= 1) {
          return NextResponse.json({ 
            error: 'Free users are limited to 1 integration. Upgrade to premium for unlimited integrations.' 
          }, { status: 403 });
        }
      }

      const newApiKey = `ozza_${nanoid(32)}`;
      
      const result = await db
        .insert(integrations)
        .values({
          userId,
          apiKey: newApiKey,
          webhookUrl: null,
          enabledEvents: [],
          webhookSecret: null,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      return NextResponse.json({
        apiKey: newApiKey,
        integrationId: result[0].id,
        message: 'API key generated successfully'
      });
    }
  } catch (error) {
    console.error('Error generating API key:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
