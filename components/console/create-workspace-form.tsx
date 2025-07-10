"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Zap, Users, Building, DollarSign, Check } from "lucide-react";

const workspaceSchema = z.object({
  name: z.string().min(1, "Workspace name is required").max(50, "Name must be less than 50 characters"),
  description: z.string().optional(),
  subscription_tier: z.enum(["starter", "professional", "enterprise", "enterprise_plus"]),
  business_context: z.object({
    industry: z.string().optional(),
    company_size: z.string().optional(),
    primary_goals: z.array(z.string()).optional(),
  }).optional(),
  is_for_client: z.boolean().default(false),
  client_email: z.string().email().optional(),
  client_name: z.string().optional(),
});

type WorkspaceFormData = z.infer<typeof workspaceSchema>;

interface CreateWorkspaceFormProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export function CreateWorkspaceForm({ user }: CreateWorkspaceFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<WorkspaceFormData>({
    resolver: zodResolver(workspaceSchema),
    defaultValues: {
      name: "",
      description: "",
      subscription_tier: "starter",
      is_for_client: user.role === 'agency',
      business_context: {
        industry: "",
        company_size: "",
        primary_goals: [],
      },
    },
  });

  const watchIsForClient = form.watch("is_for_client");
  const watchTier = form.watch("subscription_tier");

  const tiers = [
    {
      id: "starter",
      name: "Starter",
      price: "$199/month",
      tokens: "100K tokens",
      features: ["Basic AI chat", "5 integrations", "Email support"],
      recommended: false,
    },
    {
      id: "professional",
      name: "Professional",
      price: "$499/month",
      tokens: "300K tokens",
      features: ["Advanced AI", "15 integrations", "Priority support", "Team management"],
      recommended: true,
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: "$999/month",
      tokens: "750K tokens",
      features: ["Premium AI", "Unlimited integrations", "Dedicated support", "Advanced analytics"],
      recommended: false,
    },
    {
      id: "enterprise_plus",
      name: "Enterprise Plus",
      price: "$5,000/month",
      tokens: "Unlimited",
      features: ["Custom AI models", "White-labeling", "SLA guarantee", "Custom integrations"],
      recommended: false,
    },
  ];

  const industries = [
    "Technology", "Healthcare", "Finance", "E-commerce", "Manufacturing",
    "Real Estate", "Education", "Marketing", "Consulting", "Other"
  ];

  const companySizes = [
    "1-10 employees", "11-50 employees", "51-200 employees", 
    "201-1000 employees", "1000+ employees"
  ];

  const primaryGoals = [
    "Improve sales performance", "Streamline operations", "Better customer insights",
    "Automate repetitive tasks", "Enhance team collaboration", "Data-driven decisions"
  ];

  const onSubmit = async (data: WorkspaceFormData) => {
    setIsLoading(true);
    
    try {
      const response = await fetch("/api/workspaces", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          owner_id: user.id,
          agency_account_id: user.role === 'agency' ? user.id : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create workspace");
      }

      const workspace = await response.json();
      
      toast.success("Workspace created successfully!");
      
      if (data.is_for_client && data.client_email) {
        toast.info("Activation link sent to client");
      }
      
      router.push(`/console/workspaces/${workspace.id}`);
    } catch (error) {
      console.error("Error creating workspace:", error);
      toast.error("Failed to create workspace. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building className="mr-2 h-5 w-5" />
              Basic Information
            </CardTitle>
            <CardDescription>
              Set up the basic details for your workspace
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Workspace Name</FormLabel>
                  <FormControl>
                    <Input placeholder="My Business Workspace" {...field} />
                  </FormControl>
                  <FormDescription>
                    This will be visible to all workspace members
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Brief description of this workspace's purpose..."
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {user.role === 'agency' && (
              <FormField
                control={form.control}
                name="is_for_client"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        This workspace is for a client
                      </FormLabel>
                      <FormDescription>
                        Client will receive activation link and become the owner
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            )}

            {watchIsForClient && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
                <FormField
                  control={form.control}
                  name="client_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="client_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client Email</FormLabel>
                      <FormControl>
                        <Input placeholder="john@company.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Subscription Tier */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="mr-2 h-5 w-5" />
              Subscription Tier
            </CardTitle>
            <CardDescription>
              Choose the right plan for your needs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tiers.map((tier) => (
                <div
                  key={tier.id}
                  className={`relative border rounded-lg p-4 cursor-pointer transition-all ${
                    watchTier === tier.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  } ${tier.recommended ? "ring-2 ring-blue-200" : ""}`}
                  onClick={() => form.setValue("subscription_tier", tier.id as any)}
                >
                  {tier.recommended && (
                    <Badge className="absolute -top-2 left-4 bg-blue-600">
                      Recommended
                    </Badge>
                  )}
                  
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{tier.name}</h3>
                    {watchTier === tier.id && (
                      <Check className="h-5 w-5 text-blue-600" />
                    )}
                  </div>
                  
                  <p className="text-2xl font-bold text-gray-900 mb-1">{tier.price}</p>
                  <p className="text-sm text-gray-600 mb-3">{tier.tokens}</p>
                  
                  <ul className="space-y-1">
                    {tier.features.map((feature, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-center">
                        <Check className="h-3 w-3 text-green-500 mr-2" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Business Context */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Business Context (Optional)
            </CardTitle>
            <CardDescription>
              Help the AI understand your business better
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="business_context.industry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Industry</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select industry" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {industries.map((industry) => (
                          <SelectItem key={industry} value={industry}>
                            {industry}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="business_context.company_size"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Size</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {companySizes.map((size) => (
                          <SelectItem key={size} value={size}>
                            {size}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="business_context.primary_goals"
              render={() => (
                <FormItem>
                  <FormLabel>Primary Goals</FormLabel>
                  <FormDescription>
                    Select what you want to achieve with this workspace
                  </FormDescription>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {primaryGoals.map((goal) => (
                      <FormField
                        key={goal}
                        control={form.control}
                        name="business_context.primary_goals"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={goal}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(goal)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...(field.value || []), goal])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== goal
                                          )
                                        )
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal">
                                {goal}
                              </FormLabel>
                            </FormItem>
                          )
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Creating..." : "Create Workspace"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
