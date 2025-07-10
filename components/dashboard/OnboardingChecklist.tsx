'use client';

import React, { useState, Fragment } from 'react';
import { Transition } from '@headlessui/react';
import { 
  CheckCircle2, 
  Circle, 
  ChevronRight, 
  X, 
  Trophy, 
  Clock,
  Star,
  Target,
  Gift
} from 'lucide-react';

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
  estimatedTime: number; // in minutes
  priority: 'high' | 'medium' | 'low';
  category: 'setup' | 'content' | 'launch' | 'growth';
  action: {
    label: string;
    href: string;
  };
}

interface OnboardingChecklistProps {
  userRole: 'coach' | 'agency' | 'client';
  items: ChecklistItem[];
  onItemComplete: (itemId: string) => void;
  onDismiss?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const defaultCoachItems: ChecklistItem[] = [
  {
    id: 'profile-setup',
    title: 'Complete Your Coach Profile',
    description: 'Add your photo, bio, and coaching specialties to build trust with agencies',
    isCompleted: false,
    estimatedTime: 10,
    priority: 'high',
    category: 'setup',
    action: {
      label: 'Complete Profile',
      href: '/dashboard/profile'
    }
  },
  {
    id: 'first-agency-invite',
    title: 'Invite Your First Agency',
    description: 'Send an invitation link to start building your coaching network',
    isCompleted: false,
    estimatedTime: 5,
    priority: 'high',
    category: 'setup',
    action: {
      label: 'Generate Invite',
      href: '/dashboard/agencies/invite'
    }
  },
  {
    id: 'community-link',
    title: 'Create Community Link',
    description: 'Generate a public link for agencies to join your coaching program',
    isCompleted: false,
    estimatedTime: 8,
    priority: 'medium',
    category: 'growth',
    action: {
      label: 'Create Link',
      href: '/dashboard/community/create'
    }
  },
  {
    id: 'analytics-review',
    title: 'Review Analytics Dashboard',
    description: 'Learn how to track your network performance and growth metrics',
    isCompleted: false,
    estimatedTime: 12,
    priority: 'low',
    category: 'growth',
    action: {
      label: 'View Analytics',
      href: '/dashboard/analytics'
    }
  }
];

export default function OnboardingChecklist({ 
  userRole, 
  items = defaultCoachItems, 
  onItemComplete, 
  onDismiss,
  isCollapsed = false,
  onToggleCollapse
}: OnboardingChecklistProps) {
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());

  const completedCount = items.filter(item => item.isCompleted || completedItems.has(item.id)).length;
  const totalCount = items.length;
  const progressPercentage = (completedCount / totalCount) * 100;
  const isCompleted = completedCount === totalCount;

  const handleItemComplete = (item: ChecklistItem) => {
    setCompletedItems(prev => new Set(prev).add(item.id));
    onItemComplete(item.id);
  };

  const estimatedTimeRemaining = items
    .filter(item => !item.isCompleted && !completedItems.has(item.id))
    .reduce((total, item) => total + item.estimatedTime, 0);

  if (isCollapsed) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={onToggleCollapse}
          className="inline-flex items-center gap-x-1.5 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          <Trophy className="h-4 w-4" />
          {completedCount}/{totalCount}
        </button>
      </div>
    );
  }

  return (
    <Transition
      show={!isCollapsed}
      as={Fragment}
      enter="transition ease-out duration-200"
      enterFrom="opacity-0 translate-x-full"
      enterTo="opacity-100 translate-x-0"
      leave="transition ease-in duration-150"
      leaveFrom="opacity-100 translate-x-0"
      leaveTo="opacity-0 translate-x-full"
    >
      <div className="fixed inset-y-0 right-0 z-40 w-80 overflow-y-auto bg-white border-l border-gray-200 shadow-lg">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 px-6">
            <div className="flex items-center gap-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
                <Trophy className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Getting Started</h3>
                <p className="text-xs text-gray-500">Complete your setup</p>
              </div>
            </div>
            <div className="flex items-center gap-x-2">
              {onToggleCollapse && (
                <button
                  onClick={onToggleCollapse}
                  className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              )}
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          {/* Progress */}
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-900">
                {completedCount} of {totalCount} completed
              </span>
              <span className="text-gray-500">
                {isCompleted ? 'All done!' : `~${estimatedTimeRemaining} min left`}
              </span>
            </div>
            
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                <span>Progress</span>
                <span>{Math.round(progressPercentage)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              
              {isCompleted && (
                <div className="flex items-center gap-x-1 mt-2 text-sm text-green-600 font-medium">
                  <Trophy className="h-4 w-4" />
                  Congratulations! Setup complete!
                </div>
              )}
            </div>
          </div>

          {/* Checklist Items */}
          <div className="flex-1 px-6 py-4">
            <ul role="list" className="space-y-3">
              {items.map((item) => {
                const isItemCompleted = item.isCompleted || completedItems.has(item.id);
                
                return (
                  <li key={item.id} className={`group relative ${isItemCompleted ? 'opacity-75' : ''}`}>
                    <div className={`flex items-start gap-x-3 rounded-lg border p-3 transition-all duration-200 ${
                      isItemCompleted 
                        ? 'bg-gray-50 border-gray-200' 
                        : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    } ${
                      item.priority === 'high' ? 'border-l-4 border-l-red-500' :
                      item.priority === 'medium' ? 'border-l-4 border-l-yellow-500' :
                      'border-l-4 border-l-gray-400'
                    }`}>
                      {/* Checkbox */}
                      <button
                        onClick={() => !isItemCompleted && handleItemComplete(item)}
                        className="mt-0.5 flex-shrink-0"
                        disabled={isItemCompleted}
                      >
                        {isItemCompleted ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : (
                          <Circle className="h-5 w-5 text-gray-400 group-hover:text-indigo-500" />
                        )}
                      </button>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-x-2 mb-1">
                          <h4 className={`text-sm font-medium ${
                            isItemCompleted ? 'line-through text-gray-500' : 'text-gray-900'
                          }`}>
                            {item.title}
                          </h4>
                          {item.priority === 'high' && !isItemCompleted && (
                            <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">
                              High
                            </span>
                          )}
                        </div>
                        
                        <p className={`text-xs mb-2 ${
                          isItemCompleted ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {item.description}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-x-2 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            <span>{item.estimatedTime} min</span>
                            <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10 capitalize">
                              {item.category}
                            </span>
                          </div>
                          
                          {!isItemCompleted && (
                            <a
                              href={item.action.href}
                              className="text-xs font-medium text-indigo-600 hover:text-indigo-500"
                            >
                              {item.action.label} →
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </Transition>
  );
}