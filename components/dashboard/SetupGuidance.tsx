'use client';

import { useState } from 'react';
import { ChevronRight, CheckCircle, Circle, X } from 'lucide-react';

interface SetupStep {
  id: string;
  title: string;
  completed: boolean;
  href?: string;
}

const setupSteps: SetupStep[] = [
  {
    id: 'profile',
    title: 'Complete your profile',
    completed: false,
    href: '/dashboard/coach/settings'
  },
  {
    id: 'branding',
    title: 'Upload logo & choose colors',
    completed: false,
    href: '/dashboard/coach/webapp/settings'
  },
  {
    id: 'community',
    title: 'Set up community link',
    completed: true
  },
  {
    id: 'first-agency',
    title: 'Invite your first agency',
    completed: false,
    href: '/dashboard/coach/webapp/management'
  }
];

interface SetupGuidanceProps {
  className?: string;
}

export default function SetupGuidance({ className = "" }: SetupGuidanceProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  
  const completedSteps = setupSteps.filter(step => step.completed).length;
  const totalSteps = setupSteps.length;
  const isComplete = completedSteps === totalSteps;
  
  if (isDismissed || isComplete) return null;

  return (
    <div className={className}>
      <div className="bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-yellow-500/10 backdrop-blur-xl border border-orange-400/20 rounded-xl overflow-hidden">
        <div 
          className="p-4 cursor-pointer flex items-center justify-between"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-amber-400 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">{completedSteps}</span>
            </div>
            <div>
              <h3 className="text-white font-medium text-sm">Setup Progress</h3>
              <p className="text-gray-400 text-xs">{completedSteps} of {totalSteps} completed</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="w-20 bg-white/10 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-orange-400 to-amber-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(completedSteps / totalSteps) * 100}%` }}
              />
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsDismissed(true);
              }}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
          </div>
        </div>

        {isExpanded && (
          <div className="px-4 pb-4 space-y-2">
            {setupSteps.map((step) => (
              <div
                key={step.id}
                className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                  step.href ? 'hover:bg-white/5 cursor-pointer' : ''
                }`}
                onClick={() => step.href && (window.location.href = step.href)}
              >
                {step.completed ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : (
                  <Circle className="w-4 h-4 text-gray-400" />
                )}
                <span className={`text-sm ${step.completed ? 'text-green-300' : 'text-gray-300'}`}>
                  {step.title}
                </span>
                {step.href && !step.completed && (
                  <ChevronRight className="w-3 h-3 text-gray-400 ml-auto" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}