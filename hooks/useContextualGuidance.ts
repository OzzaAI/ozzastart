'use client'

import { useState, useEffect } from 'react'

interface UserBehavior {
  currentPage: string
  timeOnPage: number
  previousActions: string[]
  hesitationPoints: string[]
  completedTasks: string[]
  experienceLevel: 'beginner' | 'intermediate' | 'expert'
  userRole: string
}

interface GuidanceContent {
  type: 'tip' | 'warning' | 'success' | 'next-step'
  title: string
  message: string
  action?: {
    label: string
    onClick: () => void
  }
  position?: 'top' | 'bottom' | 'left' | 'right'
  priority: number
}

export const useContextualGuidance = (userBehavior: UserBehavior) => {
  const [activeGuidance, setActiveGuidance] = useState<GuidanceContent | null>(null)
  const [guidanceHistory, setGuidanceHistory] = useState<string[]>([])

  useEffect(() => {
    const guidance = determineGuidance(userBehavior)
    if (guidance && !guidanceHistory.includes(guidance.title)) {
      setActiveGuidance(guidance)
    }
  }, [userBehavior, guidanceHistory])

  const determineGuidance = (behavior: UserBehavior): GuidanceContent | null => {
    const { currentPage, timeOnPage, userRole, experienceLevel, completedTasks } = behavior

    // Agency dashboard guidance
    if (currentPage === '/dashboard/agency' && experienceLevel === 'beginner') {
      if (timeOnPage > 10000 && !completedTasks.includes('created_first_project')) {
        return {
          type: 'tip',
          title: 'Ready to create your first project?',
          message: 'Most successful agencies start with a simple portfolio project to showcase their capabilities.',
          action: {
            label: 'Create Project',
            onClick: () => {
              // Navigate to project creation
              window.location.href = '/dashboard/agency/projects/new'
            }
          },
          priority: 1
        }
      }
    }

    // Project creation guidance
    if (currentPage === '/dashboard/agency/projects/new') {
      if (timeOnPage > 5000 && behavior.hesitationPoints.includes('project_type')) {
        return {
          type: 'tip',
          title: 'Not sure which project type?',
          message: 'Start with a chatbot - they\'re easier to scope and most clients understand the value immediately.',
          priority: 2
        }
      }
    }

    // Client dashboard guidance
    if (currentPage === '/dashboard/client' && userRole === 'client') {
      if (behavior.previousActions.includes('viewed_progress') && timeOnPage > 8000) {
        return {
          type: 'next-step',
          title: 'Questions about your progress?',
          message: 'Your agency team is here to help. Feel free to reach out anytime.',
          action: {
            label: 'Contact Team',
            onClick: () => {
              // Open chat or contact form
            }
          },
          priority: 1
        }
      }
    }

    // Coach dashboard guidance
    if (currentPage === '/dashboard/coach' && userRole === 'coach') {
      if (behavior.previousActions.includes('viewed_agency_metrics')) {
        return {
          type: 'warning',
          title: 'Agency needs attention',
          message: 'DataFlow AI has declining metrics. Consider scheduling a check-in call.',
          action: {
            label: 'Schedule Call',
            onClick: () => {
              // Open scheduling interface
            }
          },
          priority: 3
        }
      }
    }

    // First-time user guidance
    if (experienceLevel === 'beginner' && completedTasks.length === 0) {
      return {
        type: 'success',
        title: 'Welcome to Ozza!',
        message: 'Let\'s get you set up for success. We\'ll guide you through the essential first steps.',
        priority: 1
      }
    }

    return null
  }

  const dismissGuidance = (guidanceTitle: string) => {
    setActiveGuidance(null)
    setGuidanceHistory(prev => [...prev, guidanceTitle])
  }

  const showGuidance = (guidance: GuidanceContent) => {
    setActiveGuidance(guidance)
  }

  return {
    activeGuidance,
    dismissGuidance,
    showGuidance,
    hasSeenGuidance: (title: string) => guidanceHistory.includes(title)
  }
}

// Smart defaults hook
export const useSmartDefaults = (context: any) => {
  const [defaults, setDefaults] = useState<Record<string, any>>({})

  useEffect(() => {
    const computedDefaults = computeSmartDefaults(context)
    setDefaults(computedDefaults)
  }, [context])

  const computeSmartDefaults = (ctx: any) => {
    const { userRole, previousProjects = [], currentForm, clientData } = ctx

    const defaults: Record<string, any> = {}

    // Project form defaults
    if (currentForm === 'project_creation') {
      // Default project type based on experience
      if (previousProjects.length === 0) {
        defaults.projectType = 'chatbot'
      } else if (previousProjects.filter((p: any) => p.type === 'chatbot').length >= 2) {
        defaults.projectType = 'analytics'
      }

      // Default timeline based on project type and experience
      if (defaults.projectType === 'chatbot') {
        defaults.timeline = previousProjects.length > 2 ? '3-4 weeks' : '4-6 weeks'
      }

      // Default budget based on client data
      if (clientData?.revenue) {
        if (clientData.revenue > 1000000) {
          defaults.budget = '$15,000-25,000'
        } else if (clientData.revenue > 100000) {
          defaults.budget = '$8,000-15,000'
        } else {
          defaults.budget = '$5,000-10,000'
        }
      }

      // Default team size based on project complexity
      if (defaults.projectType === 'chatbot') {
        defaults.teamSize = '2-3 people'
      } else if (defaults.projectType === 'analytics') {
        defaults.teamSize = '3-4 people'
      } else {
        defaults.teamSize = '4-6 people'
      }
    }

    // User profile defaults
    if (currentForm === 'profile_setup' && userRole === 'agency') {
      defaults.industryFocus = 'Small Business'
      defaults.specialization = 'Customer Service AI'
      defaults.teamSize = '1-5 employees'
    }

    return defaults
  }

  return { defaults, updateContext: (newContext: any) => setDefaults(computeSmartDefaults(newContext)) }
}

// Adaptive interface hook
export const useAdaptiveInterface = (userBehavior: UserBehavior) => {
  const [interfaceState, setInterfaceState] = useState({
    showAdvancedOptions: false,
    quickActions: [] as string[],
    layoutPreference: 'default' as 'default' | 'compact' | 'detailed'
  })

  useEffect(() => {
    updateInterfaceState(userBehavior)
  }, [userBehavior])

  const updateInterfaceState = (behavior: UserBehavior) => {
    const { experienceLevel, previousActions, userRole, completedTasks } = behavior

    // Show advanced options for experienced users
    const showAdvanced = experienceLevel === 'expert' || completedTasks.length > 10

    // Determine quick actions based on frequent behaviors
    const quickActions = []
    if (previousActions.filter(a => a === 'create_project').length > 3) {
      quickActions.push('create_project')
    }
    if (previousActions.filter(a => a === 'contact_team').length > 2) {
      quickActions.push('contact_team')
    }
    if (previousActions.filter(a => a === 'view_analytics').length > 5) {
      quickActions.push('view_analytics')
    }

    // Layout preference based on role and behavior
    let layoutPreference: 'default' | 'compact' | 'detailed' = 'default'
    if (userRole === 'coach' && experienceLevel === 'expert') {
      layoutPreference = 'detailed'
    } else if (previousActions.length > 20 && experienceLevel === 'expert') {
      layoutPreference = 'compact'
    }

    setInterfaceState({
      showAdvancedOptions: showAdvanced,
      quickActions,
      layoutPreference
    })
  }

  return interfaceState
}