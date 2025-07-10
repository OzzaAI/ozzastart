import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db/drizzle";
import { subscription, user } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Cancel active subscription if exists (stub implementation)
    try {
      const [activeSub] = await db
        .select()
        .from(subscription)
        .where(eq(subscription.userId, userId));

      if (activeSub && activeSub.status === "active") {
        // TODO: Integrate with Stripe to cancel subscription
        await db
          .update(subscription)
          .set({ status: "canceled", cancelAtPeriodEnd: true, canceledAt: new Date() })
          .where(eq(subscription.id, activeSub.id));
      }
    } catch (subError) {
      console.error("Error canceling subscription:", subError);
      // Continue; account deletion should still proceed
    }

    // Soft-delete user account (set deletedAt timestamp)
    await db
      .update(user)
      .set({ deletedAt: new Date() })
      .where(eq(user.id, userId));

    // Destroy all sessions for this user
    await auth.invalidateAllSessions(userId);

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("Error deleting account:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 