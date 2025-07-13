'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { 
  Shield, 
  Users, 
  Eye, 
  UserPlus, 
  Link as LinkIcon,
  Copy,
  Settings,
  BarChart3,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

type User = {
  id: string;
  email: string;
  role: 'admin' | 'coach' | 'agency' | 'client';
  createdAt: string;
  lastLogin?: string;
  status: 'active' | 'suspended';
};

type AdminUser = {
  id: string;
  email: string;
  role: 'admin';
};

type Agency = {
  id: string;
  name: string;
  coachEmail?: string;
  clientCount: number;
  revenue: number;
  status: 'active' | 'inactive' | 'setup';
  createdAt: string;
};

type SystemStats = {
  totalUsers: number;
  totalCoaches: number;
  totalAgencies: number;
  totalClients: number;
  totalRevenue: number;
  activeIssues: number;
};

export default function AdminPortal() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const router = useRouter();

  useEffect(() => {
    checkAdminAccess();
  }, [checkAdminAccess]);

  const checkAdminAccess = useCallback(async () => {
    try {
      const sessionResponse = await authClient.getSession();
      
      if (!sessionResponse?.data?.session) {
        router.push('/login');
        return;
      }

      // Check admin access via API
      const response = await fetch('/api/admin/verify');
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Access denied');
        return;
      }

      setUser(data.user);
      loadAdminData();
    } catch (err) {
      console.error('Error checking admin access:', err);
      setError('Failed to verify admin access');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const loadAdminData = async () => {
    try {
      const [usersRes, agenciesRes, statsRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/agencies'),
        fetch('/api/admin/stats')
      ]);

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.users);
      }

      if (agenciesRes.ok) {
        const agenciesData = await agenciesRes.json();
        setAgencies(agenciesData.agencies);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats);
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
    }
  };

  const generateCoachInvite = async () => {
    if (!inviteEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    try {
      const response = await fetch('/api/admin/invite-coach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: inviteEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        setGeneratedLink(data.inviteLink);
        setInviteEmail('');
        toast.success('Coach invite link generated!');
      } else {
        toast.error(data.error || 'Failed to generate invite');
      }
    } catch (error) {
      console.error('Error generating invite:', error);
      toast.error('Failed to generate invite');
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const response = await fetch('/api/admin/update-user-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, role: newRole }),
      });

      if (response.ok) {
        toast.success('User role updated');
        loadAdminData();
      } else {
        toast.error('Failed to update user role');
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('Failed to update user role');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <Shield className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-red-800 mb-2">Access Denied</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => router.push('/login')} variant="outline">
              Return to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <div className="bg-red-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8" />
              <div>
                <h1 className="text-2xl font-bold">Ozza Admin Portal</h1>
                <p className="text-red-200">System Administration Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="destructive">ADMIN</Badge>
              <span className="text-sm">Logged in as: {user?.email}</span>
              <Button 
                variant="outline" 
                size="sm"
                className="text-white border-white hover:bg-white hover:text-red-900"
                onClick={async () => {
                  await authClient.signOut();
                  router.push('/login');
                }}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* System Stats */}
        {stats && (
          <div className="grid gap-6 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.totalCoaches} coaches, {stats.totalAgencies} agencies
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Across all agencies
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Issues</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{stats.activeIssues}</div>
                <p className="text-xs text-muted-foreground">
                  Require attention
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Status</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">Healthy</div>
                <p className="text-xs text-muted-foreground">
                  All systems operational
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Admin Interface */}
        <Tabs defaultValue="coaches" className="space-y-4">
          <TabsList>
            <TabsTrigger value="coaches">Coach Management</TabsTrigger>
            <TabsTrigger value="users">All Users</TabsTrigger>
            <TabsTrigger value="agencies">Agency Overview</TabsTrigger>
            <TabsTrigger value="system">System Tools</TabsTrigger>
          </TabsList>

          {/* Coach Management */}
          <TabsContent value="coaches" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Generate Coach Invite</CardTitle>
                <CardDescription>
                  Create secure invite links for new coaches. Only you can generate these links.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <Input
                    placeholder="coach@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    type="email"
                  />
                  <Button onClick={generateCoachInvite}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Generate Invite
                  </Button>
                </div>

                {generatedLink && (
                  <Alert>
                    <LinkIcon className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-2">
                        <p className="font-medium">Coach invite link generated:</p>
                        <div className="flex items-center gap-2 p-3 bg-background rounded border">
                          <code className="flex-1 text-sm break-all">{generatedLink}</code>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              navigator.clipboard.writeText(generatedLink);
                              toast.success('Link copied to clipboard!');
                            }}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Send this link to the coach. It will allow them to sign up with coach privileges.
                        </p>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Current Coaches</CardTitle>
                <CardDescription>Manage existing coach accounts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.filter(u => u.role === 'coach').map((coach) => (
                    <div key={coach.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{coach.email}</h4>
                        <p className="text-sm text-muted-foreground">
                          Joined: {coach.createdAt} • Status: {coach.status}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="secondary">Coach</Badge>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* All Users */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Users</CardTitle>
                <CardDescription>Complete user management and role assignment</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{user.email}</h4>
                        <p className="text-sm text-muted-foreground">
                          Role: {user.role} • Joined: {user.createdAt}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Badge 
                          variant={
                            user.role === 'admin' ? 'destructive' :
                            user.role === 'coach' ? 'default' : 'secondary'
                          }
                        >
                          {user.role}
                        </Badge>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => updateUserRole(user.id, user.role === 'coach' ? 'agency' : 'coach')}
                        >
                          Change Role
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Agency Overview */}
          <TabsContent value="agencies" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Agency Network Overview</CardTitle>
                <CardDescription>Monitor all agencies across the platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {agencies.map((agency) => (
                    <div key={agency.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{agency.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Coach: {agency.coachEmail || 'Unassigned'} • {agency.clientCount} clients • ${agency.revenue.toLocaleString()}/mo
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Badge 
                          variant={
                            agency.status === 'active' ? 'default' :
                            agency.status === 'setup' ? 'secondary' : 'destructive'
                          }
                        >
                          {agency.status}
                        </Badge>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Tools */}
          <TabsContent value="system" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>System Administration</CardTitle>
                <CardDescription>Advanced system management tools</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <Button variant="outline" className="h-20 flex-col gap-2">
                    <Settings className="h-6 w-6" />
                    Platform Settings
                  </Button>
                  <Button variant="outline" className="h-20 flex-col gap-2">
                    <BarChart3 className="h-6 w-6" />
                    Analytics Export
                  </Button>
                  <Button variant="outline" className="h-20 flex-col gap-2">
                    <Users className="h-6 w-6" />
                    Bulk User Management
                  </Button>
                  <Button variant="outline" className="h-20 flex-col gap-2">
                    <Shield className="h-6 w-6" />
                    Security Audit
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}