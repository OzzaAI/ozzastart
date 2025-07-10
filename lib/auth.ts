import { db } from "@/db/drizzle";
import { account, session, subscription, user, verification } from "@/db/schema";
import {
  checkout,
  polar,
  portal,
  usage,
  webhooks,
} from "@polar-sh/better-auth";
import { Polar } from "@polar-sh/sdk";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";

// Utility function to safely parse dates
function safeParseDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  return new Date(value);
}

const polarClient = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN,
  server: "sandbox",
});

export const auth = betterAuth({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user,
      session,
      account,
      verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  plugins: [
    nextCookies(),
  ],
  callbacks: {
    session: ({ session, user }) => ({
      ...session,
      user: {
        ...session.user,
        role: user.role,
      },
    }),
    signIn: async ({ user, account, profile, isNewUser, url }) => {
      console.log('signIn callback triggered');
      if (account?.provider === "google") {
        console.log('Google provider detected');
        const inviteToken = url.searchParams.get('invite');
        const inviteEmail = url.searchParams.get('email');
        console.log(`Invite Token: ${inviteToken}, Invite Email: ${inviteEmail}`);

        if (inviteToken && inviteEmail) {
          // Verify the invite token server-side
          const verifyResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/verify-invite?token=${inviteToken}&email=${encodeURIComponent(inviteEmail)}`);
          const verifyData = await verifyResponse.json();
          console.log('Verify Invite Response:', verifyData);

          if (verifyData.valid && verifyData.role === 'coach') {
            console.log('Invite token valid and role is coach. Updating user role...');
            // Update user role to coach
            await db.update(user).set({ role: 'coach' }).where(eq(user.id, user.id));
            console.log('User role updated to coach.');
            // Mark invite as used (if you have such an API)
            // await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/mark-invite-used`, { method: 'POST', body: JSON.stringify({ token: inviteToken }) });
          } else {
            console.log('Invite token not valid or role is not coach.');
          }
        } else {
          console.log('No invite token or email found in URL.');
        }
      }
      return true;
    },
    profile: async (profile, account) => {
      console.log('Profile callback triggered');
      if (account?.provider === "google") {
        console.log('Google provider detected in profile callback');
        // The profile object contains data from Google. We can't directly access the URL here.
        // This callback is more for transforming the profile data before it's saved.
        // We'll need to rely on the signIn callback for the invite token.
      }
      return profile;
    },
  },
});
