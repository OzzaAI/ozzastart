import { db } from "@/db/drizzle";
import { account, session, subscription, user as userTable, verification } from "@/db/schema";
import { eq } from "drizzle-orm";
import { polar, portal } from "@polar-sh/better-auth";
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

// Create Polar client only if access token is available
const polarClient = process.env.POLAR_ACCESS_TOKEN ? new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN,
  server: "sandbox",
}) : null;

export const auth = betterAuth({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: userTable,
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
    // Only add Polar plugin if client is available
    ...(polarClient ? [polar({
      client: polarClient,
      createCustomerOnSignUp: false,
      // Provide an empty 'use' array so the plugin doesn't attempt to map over undefined
      use: [portal()],
    })] : []),
  ],
  callbacks: {
    session: ({ session, user }: { session: any; user: any }) => ({
      ...session,
      user: {
        ...session.user,
        role: user.role,
      },
    }),
    signIn: async ({ user, account, profile, isNewUser, url }: any) => {
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
            await db.update(userTable).set({ role: 'coach' }).where(eq(userTable.id, user.id));
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
    profile: async (profile: any, account: any) => {
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
