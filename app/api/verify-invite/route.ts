import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { community_links, agency_invitations } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const email = searchParams.get('email');
    const agencyInviteToken = searchParams.get('agency_invite_token');

    if (token && email) {
      // Verify coach invite token
      const invite = await db.select().from(community_links).where(eq(community_links.link_code, token)).limit(1);

      if (invite.length > 0) {
        const inviteData = invite[0];
        // Assuming community_links don't have an email or used status, just check expiration
        // If you add email and used status to community_links, update this logic
        return NextResponse.json({
          valid: true,
          role: 'coach',
          email: email,
          expiresAt: null, // Or inviteData.expires_at if you add it
        });
      } else {
        return NextResponse.json({
          valid: false,
          error: 'Invalid or expired coach invite token',
        });
      }
    } else if (agencyInviteToken) {
      // Verify agency invite token
      const invite = await db.select().from(agency_invitations).where(eq(agency_invitations.token, agencyInviteToken)).limit(1);

      if (invite.length > 0) {
        const inviteData = invite[0];
        if (inviteData.status === 'pending' && new Date() < inviteData.expires_at) {
          return NextResponse.json({
            valid: true,
            role: 'agency',
            email: inviteData.agency_email,
            expiresAt: inviteData.expires_at,
            agencyName: inviteData.agency_name,
          });
        } else {
          return NextResponse.json({
            valid: false,
            error: 'Invalid, expired, or already used agency invite token',
          });
        }
      } else {
        return NextResponse.json({
          valid: false,
          error: 'Invalid or expired agency invite token',
        });
      }
    } else {
      return NextResponse.json({
        valid: false,
        error: 'Token and email or agency_invite_token required',
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Error verifying invite token:', error);
    return NextResponse.json({
      valid: false,
      error: 'Internal Server Error',
    }, { status: 500 });
  }
}