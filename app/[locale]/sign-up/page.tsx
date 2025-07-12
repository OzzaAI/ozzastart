"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { Users, Building, UserCheck, Eye, EyeOff, Mail, Lock, User, AlertCircle, ArrowLeft, Shield } from "lucide-react";

type Role = "coach" | "agency" | "client";

function SignUpContent() {
  const [step, setStep] = useState<"role" | "details">("role");
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [coachInviteToken, setCoachInviteToken] = useState<string | null>(null);
  const [coachInviteEmail, setCoachInviteEmail] = useState<string | null>(null);
  const [coachInviteValid, setCoachInviteValid] = useState<boolean | null>(null);

  const [clientInviteToken, setClientInviteToken] = useState<string | null>(null);
  const [clientInviteEmail, setClientInviteEmail] = useState<string | null>(null);
  const [clientInviteValid, setClientInviteValid] = useState<boolean | null>(null);

  const [agencyInviteToken, setAgencyInviteToken] = useState<string | null>(null);
  const [agencyInviteEmail, setAgencyInviteEmail] = useState<string | null>(null);
  const [agencyInviteValid, setAgencyInviteValid] = useState<boolean | null>(null);
  const [agencyCoachAccountId, setAgencyCoachAccountId] = useState<string | null>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const coachToken = searchParams.get('invite');
    const coachEmail = searchParams.get('email');
    
    if (coachToken && coachEmail) {
      setCoachInviteToken(coachToken);
      setCoachInviteEmail(coachEmail);
      setFormData(prev => ({ ...prev, email: coachEmail }));
      verifyCoachInviteToken(coachToken, coachEmail);
    }

    const clientToken = searchParams.get('client_invite_token');
    const clientEmail = searchParams.get('email');

    if (clientToken && clientEmail) {
      setClientInviteToken(clientToken);
      setClientInviteEmail(clientEmail);
      setFormData(prev => ({ ...prev, email: clientEmail }));
      verifyClientInviteToken(clientToken, clientEmail);
    }

    const agencyToken = searchParams.get('agency_invite_token');
    const agencyEmail = searchParams.get('email');
    const coachAccountId = searchParams.get('coach_account_id');

    if (agencyToken && agencyEmail && coachAccountId) {
      setAgencyInviteToken(agencyToken);
      setAgencyInviteEmail(agencyEmail);
      setAgencyCoachAccountId(coachAccountId);
      setFormData(prev => ({ ...prev, email: agencyEmail }));
      verifyAgencyInviteToken(agencyToken, agencyEmail);
    }
  }, [searchParams]);

  const verifyCoachInviteToken = async (token: string, email: string) => {
    try {
      const response = await fetch(`/api/verify-invite?token=${token}&email=${encodeURIComponent(email)}`);
      const data = await response.json();
      
      if (data.valid && data.role === 'coach') {
        setCoachInviteValid(true);
        setSelectedRole('coach');
        setStep('details');
        toast.success('Valid coach invite! Please complete your registration.');
      } else {
        setCoachInviteValid(false);
        setError(data.error || 'Invalid coach invite link');
      }
    } catch (error) {
      console.error('Error verifying coach invite:', error);
      setCoachInviteValid(false);
      setError('Failed to verify coach invite link');
    }
  };

  const verifyClientInviteToken = async (token: string, email: string) => {
    try {
      const response = await fetch(`/api/verify-client-invite?token=${token}&email=${encodeURIComponent(email)}`);
      const data = await response.json();
      
      if (data.valid && data.role === 'client') {
        setClientInviteValid(true);
        setSelectedRole('client');
        setStep('details');
        toast.success('Valid client invitation! Please complete your registration.');
      } else {
        setClientInviteValid(false);
        setError(data.error || 'Invalid client invitation');
      }
    } catch (error) {
      console.error('Error verifying client invite:', error);
      setClientInviteValid(false);
      setError('Failed to verify client invitation');
    }
  };

  const verifyAgencyInviteToken = async (token: string, email: string) => {
    try {
      const response = await fetch(`/api/verify-invite?agency_invite_token=${token}&email=${encodeURIComponent(email)}`);
      const data = await response.json();
      
      if (data.valid && data.role === 'agency') {
        setAgencyInviteValid(true);
        setSelectedRole('agency');
        setStep('details');
        toast.success('Valid agency invitation! Please complete your registration.');
      } else {
        setAgencyInviteValid(false);
        setError(data.error || 'Invalid agency invitation');
      }
    } catch (error) {
      console.error('Error verifying agency invite:', error);
      setAgencyInviteValid(false);
      setError('Failed to verify agency invitation');
    }
  };

  const roles = [
    {
      id: "coach" as Role,
      title: "Coach",
      description: "Partner program",
      icon: Users,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      features: [
        "Partner dashboard",
        "Revenue tracking", 
        "Resource library",
        "Priority support"
      ]
    },
    {
      id: "agency" as Role,
      title: "Agency",
      description: "Professional account",
      icon: Building,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      features: [
        "Unlimited projects",
        "Custom branding",
        "Priority support", 
        "Client management"
      ]
    },
    {
      id: "client" as Role,
      title: "Client",
      description: "Basic access",
      icon: UserCheck,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      features: [
        "Analytics dashboard",
        "Performance tracking",
        "Direct communication",
        "Free with invitation"
      ]
    }
  ];

  const handleRoleSelect = (role: Role) => {
    if (role === 'coach' && (!coachInviteToken || !coachInviteValid)) {
      setError('Coach accounts require an invitation from an administrator');
      return;
    }
    if (role === 'client' && (!clientInviteToken || !clientInviteValid)) {
      setError('Client accounts require an invitation from a coach');
      return;
    }
    if (role === 'agency' && (!agencyInviteToken || !agencyInviteValid)) {
      setError('Agency accounts require an invitation from a coach');
      return;
    }
    
    setSelectedRole(role);
    setStep("details");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    if (error) setError(null);
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      setError("Please fill in all fields");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // For coach signups, verify the invite is still valid
      if (selectedRole === 'coach' && coachInviteToken) {
        const verifyResponse = await fetch(`/api/verify-invite?token=${coachInviteToken}&email=${encodeURIComponent(formData.email)}`);
        const verifyData = await verifyResponse.json();
        
        if (!verifyData.valid) {
          setError('Coach invite link has expired or been used');
          return;
        }
      }

      // For client signups, verify the invite is still valid
      if (selectedRole === 'client' && clientInviteToken) {
        const verifyResponse = await fetch(`/api/verify-client-invite?token=${clientInviteToken}&email=${encodeURIComponent(formData.email)}`);
        const verifyData = await verifyResponse.json();
        
        if (!verifyData.valid) {
          setError('Client invitation has expired or been used');
          return;
        }
      }

      // For agency signups, verify the invite is still valid
      if (selectedRole === 'agency' && agencyInviteToken) {
        const verifyResponse = await fetch(`/api/verify-agency-invite?token=${agencyInviteToken}&email=${encodeURIComponent(formData.email)}`);
        const verifyData = await verifyResponse.json();
        
        if (!verifyData.valid) {
          setError('Agency invitation has expired or been used');
          return;
        }
      }

      await authClient.signUp.email({
        email: formData.email,
        password: formData.password,
        name: formData.name,
      });

      // Set user role and handle invite token
      const roleResponse = await fetch('/api/signup-with-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: formData.email, 
          role: selectedRole,
          inviteToken: selectedRole === 'coach' ? coachInviteToken : undefined,
          clientInviteToken: selectedRole === 'client' ? clientInviteToken : undefined,
          agencyInviteToken: selectedRole === 'agency' ? agencyInviteToken : undefined,
          agencyCoachAccountId: selectedRole === 'agency' ? agencyCoachAccountId : undefined
        }),
      });

      if (!roleResponse.ok) {
        const roleData = await roleResponse.json();
        setError(roleData.error || 'Failed to set account role');
        return;
      }

      // Mark client invite token as used for client signups
      if (selectedRole === 'client' && clientInviteToken) {
        await fetch('/api/mark-client-invite-used', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: clientInviteToken }),
        });
      }

      // Mark agency invite token as used for agency signups
      if (selectedRole === 'agency' && agencyInviteToken) {
        await fetch('/api/mark-agency-invite-used', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: agencyInviteToken }),
        });
      }
    } catch (error: any) {
      console.error("Sign up failed:", error);
      setError(error.message || "Failed to create account");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      let callbackUrl = "/dashboard";
      if (coachInviteToken && coachInviteEmail) {
        callbackUrl = `/api/handle-google-coach-signup?invite=${coachInviteToken}&email=${encodeURIComponent(coachInviteEmail)}`;
      }
      await authClient.signIn.social({
        provider: "google",
        callbackURL: callbackUrl,
      });
    } catch (error: any) {
      console.error("Google sign up failed:", error);
      setError("Google sign-up failed. Please try again.");
      setIsLoading(false);
    }
  };

  if (step === "role") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4">Join Ozza</h1>
            <p className="text-muted-foreground">
              Select your account type to get started
            </p>
            {coachInviteValid && (
              <Alert className="mt-4 border-green-200 bg-green-50">
                <Shield className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Valid coach invitation! You can create a coach account.
                </AlertDescription>
              </Alert>
            )}
            {clientInviteValid && (
              <Alert className="mt-4 border-green-200 bg-green-50">
                <Shield className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Valid client invitation! You can create a client account.
                </AlertDescription>
              </Alert>
            )}
            {agencyInviteValid && (
              <Alert className="mt-4 border-green-200 bg-green-50">
                <Shield className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Valid agency invitation! You can create an agency account.
                </AlertDescription>
              </Alert>
            )}
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {roles.map((role) => {
              const Icon = role.icon;
              return (
                <Card 
                  key={role.id}
                  className={`cursor-pointer hover:border-primary transition-all hover:scale-105 ${
                    role.id === 'coach' && (!coachInviteToken || !coachInviteValid) ? 'opacity-50 cursor-not-allowed' : 
                    role.id === 'client' && (!clientInviteToken || !clientInviteValid) ? 'opacity-50 cursor-not-allowed' : 
                    role.id === 'agency' && (!agencyInviteToken || !agencyInviteValid) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  onClick={() => handleRoleSelect(role.id)}
                >
                  <CardHeader className="text-center">
                    <div className={`mx-auto w-12 h-12 ${role.iconBg} rounded-full flex items-center justify-center mb-4`}>
                      <Icon className={`w-6 h-6 ${role.iconColor}`} />
                    </div>
                    <CardTitle className="flex items-center justify-center gap-2">
                      {role.title}
                      {role.id === 'coach' && (!coachInviteToken || !coachInviteValid) && (
                        <Shield className="h-4 w-4 text-orange-500" />
                      )}
                      {role.id === 'client' && (!clientInviteToken || !clientInviteValid) && (
                        <Shield className="h-4 w-4 text-orange-500" />
                      )}
                      {role.id === 'agency' && (!agencyInviteToken || !agencyInviteValid) && (
                        <Shield className="h-4 w-4 text-orange-500" />
                      )}
                    </CardTitle>
                    <CardDescription>
                      {role.id === 'coach' && (!coachInviteToken || !coachInviteValid) 
                        ? "Invitation required" 
                        : role.id === 'client' && (!clientInviteToken || !clientInviteValid) 
                        ? "Invitation required" 
                        : role.id === 'agency' && (!agencyInviteToken || !agencyInviteValid) 
                        ? "Invitation required" 
                        : role.description
                      }
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      {role.features.map((feature, index) => (
                        <li key={index}>• {feature}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="text-center mt-8">
            <span className="text-sm text-muted-foreground">Already have an account? </span>
            <Link href="/login" className="text-sm font-medium text-primary hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const selectedRoleData = roles.find(r => r.id === selectedRole);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep("role")}
              className="p-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <CardTitle className="text-xl">Create your {selectedRoleData?.title} account</CardTitle>
              <CardDescription>
                Sign up for Ozza and start your journey
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Google Sign Up - Primary Option */}
          <Button
            onClick={handleGoogleSignUp}
            disabled={isLoading}
            variant="outline"
            className="w-full h-12 text-base font-medium"
          >
            <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {isLoading ? "Creating account..." : "Continue with Google"}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or sign up with email
              </span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleEmailSignUp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading || !formData.name || !formData.email || !formData.password || !formData.confirmPassword}
              className="w-full h-12 text-base font-medium"
            >
              {isLoading ? "Creating account..." : "Create Account"}
            </Button>
          </form>

          <div className="space-y-4 text-center text-sm">
            <div>
              <span className="text-muted-foreground">Already have an account? </span>
              <Link href="/login" className="font-medium text-primary hover:underline">
                Sign in
              </Link>
            </div>
            
            <div className="text-xs text-muted-foreground">
              By creating an account, you agree to our{" "}
              <Link href="/terms-of-service" className="underline hover:text-foreground">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy-policy" className="underline hover:text-foreground">
                Privacy Policy
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SignUp() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col justify-center items-center w-full h-screen">
          <div className="max-w-md w-full bg-gray-200 dark:bg-gray-800 animate-pulse rounded-lg h-96"></div>
        </div>
      }
    >
      <SignUpContent />
    </Suspense>
  );
}