"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function RootDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const sessionResponse = await authClient.getSession();
        
        if (!sessionResponse?.data?.session) {
          router.push('/login');
          return;
        }

        const session = sessionResponse.data.session;
        
        // Debug: Log session structure (remove in production)
        console.log('Session structure:', JSON.stringify(session, null, 2));
        
        // Handle different possible session structures from Better Auth
        let userData, userEmail, userName, userRole, userId;
        
        if (session.user) {
          // Standard Better Auth structure
          userData = session.user;
          userEmail = userData.email;
          userName = userData.name;
          userRole = userData.role;
          userId = session.userId || userData.id;
        } else {
          // Fallback if user data is directly on session
          userEmail = session.email;
          userName = session.name;
          userRole = session.role;
          userId = session.userId || session.id;
        }
        
        // Final fallbacks with safe defaults
        const finalEmail = userEmail || 'user@example.com';
        const finalName = userName || finalEmail.split('@')[0] || 'User';
        const finalRole = userRole || 'client';
        const finalId = userId || 'unknown';
        
        setUser({
          id: finalId,
          name: finalName,
          email: finalEmail,
          role: finalRole
        });
        
        console.log('Extracted user data:', { id: finalId, name: finalName, email: finalEmail, role: finalRole });
        
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    await authClient.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Use new Tailkit layout for all dashboard pages
  return (
    <DashboardLayout
      user={{
        name: user.name,
        email: user.email,
        role: user.role,
        plan: 'Pro'
      }}
      onLogout={handleLogout}
      showOnboarding={user.role === 'coach'}
      notifications={[
        {
          id: '1',
          type: 'system',
          title: 'Welcome to your dashboard',
          description: 'Your account has been set up successfully',
          timestamp: '2 hours ago',
          isRead: false
        }
      ]}
    >
      {children}
    </DashboardLayout>
  );
}
