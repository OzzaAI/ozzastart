import { Metadata } from "next";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { ConsoleNavigation } from "@/components/console/console-navigation";
import { ConsoleHeader } from "@/components/console/console-header";

export const metadata: Metadata = {
  title: "Ozza Console - Manage Your AI Workspaces",
  description: "Create and manage AI business intelligence workspaces, MCPs, and automations.",
};

export default async function ConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const result = await auth.api.getSession({
    headers: await headers(),
  });
  
  if (!result?.session?.userId) {
    redirect("/sign-in?redirect=/console");
  }

  const session = { user: result.session.user };

  return (
    <div className="min-h-screen bg-gray-50">
      <ConsoleHeader user={session.user} />
      
      <div className="flex">
        <ConsoleNavigation userRole={session.user.role} />
        
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
