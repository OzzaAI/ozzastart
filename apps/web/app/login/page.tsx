'use client';

import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
    } else {
      router.push('/dashboard');
      router.refresh(); // Ensure the layout re-renders with the new session
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md rounded-lg border bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-center text-2xl font-bold">Login</h1>
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium" htmlFor="email">
              Email
            </label>
            <input
              className="w-full rounded-md border p-2"
              type="email"
              id="email"
              name="email"
              required
            />
          </div>
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium" htmlFor="password">
              Password
            </label>
            <input
              className="w-full rounded-md border p-2"
              type="password"
              id="password"
              name="password"
              required
            />
          </div>
          <button
            className="w-full rounded-md bg-blue-600 p-2 text-white hover:bg-blue-700"
            type="submit"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
} 