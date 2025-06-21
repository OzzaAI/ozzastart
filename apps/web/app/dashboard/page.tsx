'use client';

import { createSupabaseBrowserClient } from '../../lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
      } else {
        router.push('/login');
      }
    };

    fetchUser();
  }, [supabase, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="w-full max-w-lg rounded-lg border p-8 text-center shadow-sm">
        <h1 className="mb-4 text-3xl font-bold">
          Welcome to Your Dashboard
        </h1>
        <p className="mb-6">
          You are logged in as: <strong>{user.email}</strong>
        </p>
        <button
          onClick={handleLogout}
          className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
        >
          Log Out
        </button>
      </div>
    </div>
  );
} 