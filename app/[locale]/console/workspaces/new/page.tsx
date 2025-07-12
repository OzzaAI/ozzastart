import { auth } from "@/lib/auth";
import { CreateWorkspaceForm } from "@/components/console/create-workspace-form";
import { redirect } from "next/navigation";

export default async function NewWorkspacePage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login?redirect=/console/workspaces/new");
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Create New Workspace</h1>
        <p className="text-gray-600 mt-2">
          Set up a new AI business intelligence workspace for yourself or a client.
        </p>
      </div>

      <CreateWorkspaceForm user={session.user} />
    </div>
  );
}
