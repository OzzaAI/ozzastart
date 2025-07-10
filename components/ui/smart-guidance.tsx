'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Lightbulb, 
  AlertTriangle, 
  CheckCircle, 
  ArrowRight, 
  X, 
  Target,
  Clock,
  Users,
  MessageSquare,
  TrendingUp,
  MousePointer,
  Eye,
  Timer,
  Zap,
  HelpCircle,
  ChevronRight
} from 'lucide-react'

// Hesitation Detection Types
interface UserBehaviorPattern {
  mouseMovements: number
  clickAttempts: number
  timeOnPage: number
  scrollBacktrack: number
  formFieldFocusTime: number
  idleTime: number
}

interface HesitationTrigger {
  type: 'idle' | 'repetitive_clicks' | 'field_focus_without_input' | 'rapid_navigation' | 'error_frequency'
  threshold: number
  condition: (behavior: UserBehaviorPattern) => boolean
}

interface AdaptiveTutorial {
  id: string
  trigger: HesitationTrigger
  steps: TutorialStep[]
  userLevel: 'beginner' | 'intermediate' | 'expert'
  context: string
}

interface TutorialStep {
  title: string
  content: string
  target?: string // CSS selector for highlighting
  type: 'tooltip' | 'modal' | 'spotlight' | 'overlay'
  action?: {
    label: string
    onClick: () => void
  }
}

interface GuidanceProps {
  type: 'tip' | 'warning' | 'success' | 'next-step' | 'hesitation-detected' | 'adaptive-tutorial'
  title: string
  message: string
  action?: {
    label: string
    onClick: () => void
  }
  onDismiss?: () => void
  position?: 'floating' | 'inline' | 'sidebar' | 'spotlight'
  priority?: number
  autoHide?: boolean
  delay?: number
  hesitationData?: UserBehaviorPattern
  tutorialSteps?: TutorialStep[]
  currentStep?: number
  userLevel?: 'beginner' | 'intermediate' | 'expert'
}

export const SmartGuidance: React.FC<GuidanceProps> = ({
  type,
  title,
  message,
  action,
  onDismiss,
  position = 'floating',
  priority = 1,
  autoHide = false,
  delay = 0
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
      setIsAnimating(true)
    }, delay)

    return () => clearTimeout(timer)
  }, [delay])

  useEffect(() => {
    if (autoHide && isVisible) {
      const hideTimer = setTimeout(() => {
        handleDismiss()
      }, 8000) // Auto-hide after 8 seconds

      return () => clearTimeout(hideTimer)
    }
  }, [isVisible, autoHide])

  const handleDismiss = () => {
    setIsAnimating(false)
    setTimeout(() => {
      setIsVisible(false)
      onDismiss?.()
    }, 300)
  }

  const getIcon = () => {
    switch (type) {
      case 'tip':
        return <Lightbulb className="h-5 w-5" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5" />
      case 'success':
        return <CheckCircle className="h-5 w-5" />
      case 'next-step':
        return <Target className="h-5 w-5" />
      default:
        return <Lightbulb className="h-5 w-5" />
    }
  }

  const getStyles = () => {
    const base = "transition-all duration-300 ease-in-out"
    
    switch (type) {
      case 'tip':
        return {
          card: `${base} border-blue-200 bg-blue-50 shadow-lg`,
          icon: 'text-blue-600',
          text: 'text-blue-800',
          button: 'bg-blue-600 hover:bg-blue-700'
        }
      case 'warning':
        return {
          card: `${base} border-orange-200 bg-orange-50 shadow-lg`,
          icon: 'text-orange-600',
          text: 'text-orange-800',
          button: 'bg-orange-600 hover:bg-orange-700'
        }
      case 'success':
        return {
          card: `${base} border-green-200 bg-green-50 shadow-lg`,
          icon: 'text-green-600',
          text: 'text-green-800',
          button: 'bg-green-600 hover:bg-green-700'
        }
      case 'next-step':
        return {
          card: `${base} border-purple-200 bg-purple-50 shadow-lg`,
          icon: 'text-purple-600',
          text: 'text-purple-800',
          button: 'bg-purple-600 hover:bg-purple-700'
        }
      default:
        return {
          card: `${base} border-gray-200 bg-gray-50`,
          icon: 'text-gray-600',
          text: 'text-gray-800',
          button: 'bg-gray-600 hover:bg-gray-700'
        }
    }
  }

  const getPositionStyles = () => {
    switch (position) {
      case 'floating':
        return `fixed bottom-4 right-4 z-50 max-w-sm ${
          isAnimating ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
        }`
      case 'sidebar':
        return `w-80 ${
          isAnimating ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
        }`
      case 'inline':
        return `w-full ${
          isAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`
      default:
        return 'w-full'
    }
  }

  if (!isVisible) return null

  const styles = getStyles()

  return (
    <div className={getPositionStyles()}>
      <Card className={`${styles.card} border-l-4`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className={styles.icon}>
                {getIcon()}
              </div>
              <CardTitle className={`text-sm ${styles.text}`}>
                {title}
              </CardTitle>
              {priority === 1 && (
                <Badge variant="destructive" className="text-xs">
                  Important
                </Badge>
              )}
            </div>
            {onDismiss && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="h-6 w-6 p-0 hover:bg-transparent"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className={`text-sm ${styles.text} mb-4`}>
            {message}
          </p>
          {action && (
            <Button 
              onClick={action.onClick}
              size="sm"
              className={`${styles.button} text-white`}
            >
              {action.label}
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Contextual Help Sidebar
export const ContextualSidebar: React.FC<{
  currentPage: string
  userProgress: number
  userRole: string
}> = ({ currentPage, userProgress, userRole }) => {
  const getHelpContent = () => {
    // Agency project creation help
    if (currentPage === '/dashboard/agency/projects/new') {
      return {
        title: "Creating Your Project",
        icon: <Target className="h-5 w-5" />,
        tips: [
          "Start with client needs, not technology",
          "Set realistic timelines with buffer time",
          "Include stakeholder communication plan"
        ],
        nextStep: userProgress < 50 ? "Focus on clear project scope" : "Add team members and milestones",
        resources: [
          { label: "Project Templates", href: "/templates" },
          { label: "Pricing Guide", href: "/pricing" }
        ]
      }
    }

    // Client dashboard help
    if (currentPage === '/dashboard/client' && userRole === 'client') {
      return {
        title: "Understanding Your Progress",
        icon: <TrendingUp className="h-5 w-5" />,
        tips: [
          "Check weekly progress updates",
          "Review deliverables as they're completed",
          "Ask questions early and often"
        ],
        nextStep: "Review this week's deliverables",
        resources: [
          { label: "Contact Your Team", href: "/contact" },
          { label: "FAQ", href: "/faq" }
        ]
      }
    }

    // Coach dashboard help
    if (currentPage === '/dashboard/coach' && userRole === 'coach') {
      return {
        title: "Coaching Best Practices",
        icon: <Users className="h-5 w-5" />,
        tips: [
          "Focus on revenue-impacting issues first",
          "Schedule regular check-ins",
          "Share successful strategies across agencies"
        ],
        nextStep: "Review agencies needing attention",
        resources: [
          { label: "Coaching Playbook", href: "/playbook" },
          { label: "Success Metrics", href: "/metrics" }
        ]
      }
    }

    return null
  }

  const content = getHelpContent()
  
  if (!content) return null

  return (
    <Card className="w-80 bg-white shadow-lg border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          {content.icon}
          {content.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="text-sm font-medium mb-2">Quick Tips</h4>
          <ul className="space-y-1">
            {content.tips.map((tip, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                {tip}
              </li>
            ))}
          </ul>
        </div>

        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="text-sm font-medium text-blue-800 mb-1">Next Step</h4>
          <p className="text-sm text-blue-700">{content.nextStep}</p>
        </div>

        <div>
          <h4 className="text-sm font-medium mb-2">Helpful Resources</h4>
          <div className="space-y-1">
            {content.resources.map((resource, index) => (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                className="w-full justify-start text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                asChild
              >
                <a href={resource.href}>
                  {resource.label}
                  <ArrowRight className="h-3 w-3 ml-auto" />
                </a>
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Progress Nudge Component
export const ProgressNudge: React.FC<{
  currentStep: number
  totalSteps: number
  nextAction: string
  onActionClick: () => void
}> = ({ currentStep, totalSteps, nextAction, onActionClick }) => {
  const progress = (currentStep / totalSteps) * 100
  
  return (
    <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="font-medium text-sm">You're making great progress!</h4>
            <p className="text-xs text-muted-foreground">
              {currentStep} of {totalSteps} steps completed
            </p>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-green-600">{Math.round(progress)}%</div>
          </div>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div 
            className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        <Button 
          onClick={onActionClick}
          size="sm"
          className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
        >
          {nextAction}
          <ArrowRight className="h-3 w-3 ml-2" />
        </Button>
      </CardContent>
    </Card>
  )
}

// Smart Empty State with Guidance
export const SmartEmptyState: React.FC<{
  userRole: string
  context: string
  onPrimaryAction: () => void
  onSecondaryAction?: () => void
}> = ({ userRole, context, onPrimaryAction, onSecondaryAction }) => {
  const getEmptyStateContent = () => {
    if (context === 'projects' && userRole === 'agency') {
      return {
        icon: <Target className="h-16 w-16 mx-auto mb-4 text-blue-500" />,
        title: "Ready to land your first client?",
        description: "Start with a portfolio project that showcases your AI expertise. Most successful agencies begin here.",
        primaryAction: "Create Portfolio Project",
        secondaryAction: "Browse Templates",
        tips: [
          "Takes about 15 minutes to set up",
          "Impresses potential clients",
          "Sets you apart from competitors"
        ]
      }
    }

    if (context === 'team' && userRole === 'agency') {
      return {
        icon: <Users className="h-16 w-16 mx-auto mb-4 text-purple-500" />,
        title: "Time to build your team",
        description: "You're growing! Add team members to handle more client projects efficiently.",
        primaryAction: "Invite Team Members",
        secondaryAction: "Learn About Roles",
        tips: [
          "Start with 1-2 key people",
          "Define clear responsibilities",
          "Set up collaboration tools"
        ]
      }
    }

    // Default empty state
    return {
      icon: <Clock className="h-16 w-16 mx-auto mb-4 text-gray-400" />,
      title: "Nothing here yet",
      description: "Get started by creating your first item.",
      primaryAction: "Get Started",
      secondaryAction: "Learn More",
      tips: []
    }
  }

  const content = getEmptyStateContent()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="text-center py-12 px-6">
        <CardContent className="space-y-6">
          {content.icon}
          
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">{content.title}</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              {content.description}
            </p>
          </div>

          {content.tips.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-lg mx-auto">
              {content.tips.map((tip, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                  {tip}
                </div>
              ))}
            </div>
          )}

          <div className="space-y-3">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                onClick={onPrimaryAction}
                size="lg"
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-lg hover:shadow-xl transform transition-all duration-200"
              >
                {content.primaryAction}
              </Button>
            </motion.div>
            
            {onSecondaryAction && (
              <Button 
                onClick={onSecondaryAction}
                variant="outline"
                size="lg"
              >
                {content.secondaryAction}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}