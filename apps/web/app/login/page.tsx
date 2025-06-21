'use client';

import { createSupabaseBrowserClient } from '../../lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="w-full max-w-sm rounded-lg border p-8 shadow-sm">
        <h1 className="mb-4 text-center text-2xl font-bold">Log In</h1>
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="mb-1 block" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border p-2"
              required
            />
          </div>
          <div className="mb-6">
            <label className="mb-1 block" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border p-2"
              required
            />
          </div>
          {error && (
            <p className="mb-4 rounded-md bg-red-100 p-2 text-center text-red-600">
              {error}
            </p>
          )}
          <button
            type="submit"
            className="w-full rounded-md bg-blue-600 p-2 text-white hover:bg-blue-700"
          >
            Log In
          </button>
        </form>
      </div>
    </div>
  );
} 