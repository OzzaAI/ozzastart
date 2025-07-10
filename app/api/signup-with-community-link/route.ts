import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { user, ozza_accounts, ozza_account_members, community_links } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { auth } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { email, name, password, communityLinkCode } = await request.json();

    if (!email || !name || !password || !communityLinkCode) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Validate community link code and get referrer's user ID
    const referralEntry = await db.select().from(community_links).where(eq(community_links.link_code, communityLinkCode)).limit(1);

    if (!referralEntry || referralEntry.length === 0) {
      return NextResponse.json({ error: 'Invalid community link code' }, { status: 400 });
    }

    const referrerUserId = referralEntry[0].user_id;

    // Get referrer's role
    const referrerUser = await db.select().from(user).where(eq(user.id, referrerUserId)).limit(1);

    if (!referrerUser || referrerUser.length === 0) {
      return NextResponse.json({ error: 'Referrer user not found' }, { status: 500 });
    }

    const referrerRole = referrerUser[0].role;

    let newUserRole: 'agency' | 'client';
    let newAccountName: string;

    if (referrerRole === 'coach') {
      newUserRole = 'agency';
      newAccountName = `${name}'s Agency`;
    } else if (referrerRole === 'agency') {
      newUserRole = 'client';
      newAccountName = `${name}'s Client Account`;
    } else {
      return NextResponse.json({ error: 'Invalid referrer role' }, { status: 400 });
    }

    // 2. Create the new user using better-auth's signup (assuming it handles password hashing)
    // Note: better-auth's direct signup via API might not expose a direct method for setting roles.
    // We might need to create the user first, then update their role in a separate step.
    // For simplicity, let's assume better-auth's signup returns the new user object.
    // In a real scenario, you'd integrate with better-auth's signup flow.

    // Placeholder for better-auth signup
    const newUser = await auth.api.signUp({ email, password, name });

    if (!newUser || !newUser.user) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }

    // Update the user's role in our database
    await db.update(user).set({ role: newUserRole }).where(eq(user.id, newUser.user.id));

    // 3. Create a new account for the new user
    const [newAccount] = await db.insert(ozza_accounts).values({
      name: newAccountName,
      owner_id: newUser.user.id,
      created_at: new Date(),
      updated_at: new Date(),
    }).returning();

    if (!newAccount) {
      return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
    }

    // 4. Link the new user to their new account as an owner
    await db.insert(ozza_account_members).values({
      user_id: newUser.user.id,
      account_id: newAccount.id,
      role: 'owner',
      created_at: new Date(),
      updated_at: new Date(),
    });

    // 5. Link the new account to the referrer's account (if referrer is coach, link agency to coach's account)
    // Find the referrer's account
    const referrerAccountMember = await db.select().from(ozza_account_members).where(eq(ozza_account_members.user_id, referrerUserId)).limit(1);

    if (referrerAccountMember && referrerAccountMember.length > 0) {
      await db.insert(ozza_account_members).values({
        user_id: newUser.user.id,
        account_id: referrerAccountMember[0].account_id,
        role: newUserRole, // The new user's role within the referrer's account
        created_at: new Date(),
        updated_at: new Date(),
      });
    }

    // 6. Generate a new referral code for the newly signed-up coach or agency
    if (newUserRole === 'coach' || newUserRole === 'agency') {
      const newCommunityLinkCode = uuidv4();
      await db.insert(community_links).values({
        user_id: newUser.user.id,
        link_code: newCommunityLinkCode,
        created_at: new Date(),
      });
    }

    return NextResponse.json({
      success: true,
      message: 'User signed up and linked successfully',
      userId: newUser.user.id,
      accountId: newAccount.id,
      redirectUrl: '/dashboard',
    });

  } catch (error) {
    console.error('Error in signup-with-community-link API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
