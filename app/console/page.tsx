import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import ConsoleDashboard from "@/components/console/console-dashboard";

export default async function ConsolePage() {
  const result = await auth.api.getSession({
    headers: await headers(),
  });

  if (!result?.session?.userId) {
    redirect("/sign-in");
  }

  return <ConsoleDashboard user={result.session.user} />;
}
