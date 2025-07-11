import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { branding } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { authClient } from '@/lib/auth-client';

export async function GET(request: NextRequest) {
  try {
    const sessionResponse = await authClient.getSession();
    if (!sessionResponse?.data?.session) {
      // Return default theme for unauthenticated users
      return NextResponse.json({
        primaryColor: '#3b82f6',
        secondaryColor: '#1e40af',
        accentColor: '#06b6d4',
        isWhiteLabelEnabled: false,
        brandName: 'Ozza',
        logoUrl: null
      });
    }

    const userId = sessionResponse.data.session.userId;
    
    const brandingData = await db
      .select({
        primaryColor: branding.primaryColor,
        secondaryColor: branding.secondaryColor,
        accentColor: branding.accentColor,
        isWhiteLabelEnabled: branding.isWhiteLabelEnabled,
        brandName: branding.brandName,
        logoUrl: branding.logoUrl
      })
      .from(branding)
      .where(eq(branding.userId, userId))
      .limit(1);

    if (brandingData.length === 0) {
      // Return default theme
      return NextResponse.json({
        primaryColor: '#3b82f6',
        secondaryColor: '#1e40af',
        accentColor: '#06b6d4',
        isWhiteLabelEnabled: false,
        brandName: 'Ozza',
        logoUrl: null
      });
    }

    return NextResponse.json(brandingData[0]);
  } catch (error) {
    console.error('Error fetching theme:', error);
    // Return default theme on error
    return NextResponse.json({
      primaryColor: '#3b82f6',
      secondaryColor: '#1e40af',
      accentColor: '#06b6d4',
      isWhiteLabelEnabled: false,
      brandName: 'Ozza',
      logoUrl: null
    });
  }
}
