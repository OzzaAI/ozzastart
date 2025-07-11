import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { integrations } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { authClient } from '@/lib/auth-client';
import { getSubscriptionStatus } from '@/lib/subscription';
import { nanoid } from 'nanoid';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  try {
    const sessionResponse = await authClient.getSession();
    if (!sessionResponse?.data?.session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = sessionResponse.data.session.userId;
    
    const userIntegrations = await db
      .select({
        id: integrations.id,
        apiKey: integrations.apiKey,
        webhookUrl: integrations.webhookUrl,
        enabledEvents: integrations.enabledEvents,
        isActive: integrations.isActive,
        lastUsed: integrations.lastUsed,
        createdAt: integrations.createdAt,
        updatedAt: integrations.updatedAt
      })
      .from(integrations)
      .where(eq(integrations.userId, userId));

    // Mask API keys for security (show only first 8 characters)
    const maskedIntegrations = userIntegrations.map(integration => ({
      ...integration,
      apiKey: integration.apiKey.substring(0, 8) + '...' + integration.apiKey.slice(-4),
      apiKeyFull: integration.apiKey // Include full key for copy functionality
    }));

    return NextResponse.json(maskedIntegrations);
  } catch (error) {
    console.error('Error fetching integrations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionResponse = await authClient.getSession();
    if (!sessionResponse?.data?.session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = sessionResponse.data.session.userId;
    const body = await request.json();
    
    // Check subscription for advanced integrations
    const subscription = await getSubscriptionStatus(userId);
    const isPremium = subscription?.status === 'active';
    
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

    const integrationData = {
      userId,
      apiKey: body.apiKey || `ozza_${nanoid(32)}`,
      webhookUrl: body.webhookUrl || null,
      enabledEvents: body.enabledEvents || [],
      webhookSecret: body.webhookUrl ? crypto.randomBytes(32).toString('hex') : null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db
      .insert(integrations)
      .values(integrationData)
      .returning();

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error creating integration:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const sessionResponse = await authClient.getSession();
    if (!sessionResponse?.data?.session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = sessionResponse.data.session.userId;
    const body = await request.json();
    const { id, webhookUrl, enabledEvents, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: 'Integration ID is required' }, { status: 400 });
    }

    const updateData: any = {
      updatedAt: new Date()
    };

    if (webhookUrl !== undefined) updateData.webhookUrl = webhookUrl;
    if (enabledEvents !== undefined) updateData.enabledEvents = enabledEvents;
    if (isActive !== undefined) updateData.isActive = isActive;

    const result = await db
      .update(integrations)
      .set(updateData)
      .where(eq(integrations.id, id))
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error updating integration:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const sessionResponse = await authClient.getSession();
    if (!sessionResponse?.data?.session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = sessionResponse.data.session.userId;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Integration ID is required' }, { status: 400 });
    }

    const result = await db
      .delete(integrations)
      .where(eq(integrations.id, id))
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting integration:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
