import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import HeroSection from "@/components/homepage/hero-section";
import ChatWorkspace from "@/components/workspace/ChatWorkspace";

export default async function Home() {
  const result = await auth.api.getSession({
    headers: await headers(),
  });

  // If user is authenticated, show chat workspace
  if (result?.session?.userId) {
    return <ChatWorkspace />;
  }

  // If not authenticated, show landing page
  return (
    <>
      <HeroSection />
    </>
  );
}
