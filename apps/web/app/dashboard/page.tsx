import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const supabase = createSupabaseServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-4xl font-bold">Dashboard</h1>
      <p className="mt-4 text-lg">
        Welcome, <span className="font-semibold">{session.user.email}</span>
      </p>
      <div className="mt-8 w-full max-w-2xl rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Your JWT Claims</h2>
        <pre className="mt-4 overflow-x-auto rounded-md bg-gray-100 p-4 text-sm">
          {JSON.stringify(session.user, null, 2)}
        </pre>
      </div>
    </div>
  );
} 