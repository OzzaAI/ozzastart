import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { branding } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { authClient } from '@/lib/auth-client';
import { getSubscriptionStatus } from '@/lib/subscription';

export async function GET(request: NextRequest) {
  try {
    const sessionResponse = await authClient.getSession();
    if (!sessionResponse?.data?.session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = sessionResponse.data.session.userId;
    
    const brandingData = await db
      .select()
      .from(branding)
      .where(eq(branding.userId, userId))
      .limit(1);

    if (brandingData.length === 0) {
      // Return default branding
      return NextResponse.json({
        logoUrl: null,
        primaryColor: '#3b82f6',
        secondaryColor: '#1e40af',
        accentColor: '#06b6d4',
        isWhiteLabelEnabled: false,
        customDomain: null,
        brandName: null,
        favicon: null
      });
    }

    return NextResponse.json(brandingData[0]);
  } catch (error) {
    console.error('Error fetching branding:', error);
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
    
    // Check subscription for white-label features
    const subscription = await getSubscriptionStatus(userId);
    const isPremium = subscription?.status === 'active';
    
    // Restrict white-label features to premium users
    if (body.isWhiteLabelEnabled && !isPremium) {
      return NextResponse.json({ 
        error: 'White-label features require a premium subscription' 
      }, { status: 403 });
    }

    const brandingData = {
      userId,
      logoUrl: body.logoUrl || null,
      primaryColor: body.primaryColor || '#3b82f6',
      secondaryColor: body.secondaryColor || '#1e40af',
      accentColor: body.accentColor || '#06b6d4',
      isWhiteLabelEnabled: isPremium ? (body.isWhiteLabelEnabled || false) : false,
      customDomain: isPremium ? (body.customDomain || null) : null,
      brandName: body.brandName || null,
      favicon: body.favicon || null,
      updatedAt: new Date()
    };

    // Upsert branding data
    const existingBranding = await db
      .select()
      .from(branding)
      .where(eq(branding.userId, userId))
      .limit(1);

    let result;
    if (existingBranding.length > 0) {
      result = await db
        .update(branding)
        .set(brandingData)
        .where(eq(branding.userId, userId))
        .returning();
    } else {
      result = await db
        .insert(branding)
        .values(brandingData)
        .returning();
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error saving branding:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
