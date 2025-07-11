"use client";

import { useState, useEffect } from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, ArrowRight, X, RotateCcw } from 'lucide-react';

interface TourProps {
  isOpen: boolean;
  onComplete: () => void;
  onSkip: () => void;
  userRole?: string;
}

const baseTourSteps: Step[] = [
  {
    target: '[data-tour="dashboard-overview"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Welcome to Your Dashboard!</h3>
        <p>This is your main dashboard where you can see an overview of your account, recent activity, and key metrics.</p>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span>Step 1 of 6</span>
        </div>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="navigation"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Navigation Menu</h3>
        <p>Use this sidebar to navigate between different sections of your account. Each section has specific tools and features.</p>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span>Step 2 of 6</span>
        </div>
      </div>
    ),
    placement: 'right',
  },
  {
    target: '[data-tour="chat"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">AI Chat Assistant</h3>
        <p>Access our powerful AI chat feature to get help, generate content, and automate tasks. Click here to start a conversation!</p>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span>Step 3 of 6</span>
        </div>
      </div>
    ),
    placement: 'right',
  },
  {
    target: '[data-tour="upload"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">File Upload</h3>
        <p>Upload and manage your files here. You can upload documents, images, and other assets for your projects.</p>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span>Step 4 of 6</span>
        </div>
      </div>
    ),
    placement: 'right',
  },
  {
    target: '[data-tour="settings"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Account Settings</h3>
        <p>Customize your account preferences, manage your subscription, and configure integrations from the settings page.</p>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span>Step 5 of 6</span>
        </div>
      </div>
    ),
    placement: 'right',
  },
  {
    target: '[data-tour="user-menu"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">User Menu</h3>
        <p>Access your profile, account settings, and logout from this menu. You can also find help and support options here.</p>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span>Step 6 of 6</span>
        </div>
      </div>
    ),
    placement: 'bottom',
  },
];

const coachTourSteps: Step[] = [
  ...baseTourSteps,
  {
    target: '[data-tour="coach-metrics"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Coach Metrics</h3>
        <p>Track your coaching performance, client progress, and revenue metrics. This dashboard helps you optimize your coaching business.</p>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span>Coach Feature</span>
        </div>
      </div>
    ),
    placement: 'top',
  },
  {
    target: '[data-tour="client-management"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Client Management</h3>
        <p>Manage your clients, track their progress, and communicate effectively. You can invite new clients and monitor their journey.</p>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span>Coach Feature</span>
        </div>
      </div>
    ),
    placement: 'right',
  },
];

// STUB IMPLEMENTATION: temporarily disable Joyride tour to resolve build errors
export default function Tour({ isOpen, onComplete, onSkip }: TourProps) {
  // Until onboarding tour is migrated to a React 19 compatible library, render nothing.
  // Avoid runtime errors by immediately firing callbacks when the tour would have opened.
  if (isOpen) {
    onSkip();
  }
  return null;
}
