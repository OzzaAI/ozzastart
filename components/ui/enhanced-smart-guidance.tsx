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
  ChevronRight,
  Brain,
  Activity
} from 'lucide-react'

// Enhanced Hesitation Detection Types
interface UserBehaviorPattern {
  mouseMovements: number
  clickAttempts: number
  timeOnPage: number
  scrollBacktrack: number
  formFieldFocusTime: number
  idleTime: number
  errorCount: number
  rapidNavigationCount: number
  lastActivity: number
}

interface HesitationTrigger {
  type: 'idle' | 'repetitive_clicks' | 'field_focus_without_input' | 'rapid_navigation' | 'error_frequency'
  threshold: number
  condition: (behavior: UserBehaviorPattern) => boolean
  message: string
  urgency: 'low' | 'medium' | 'high'
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
  estimatedTime?: number // seconds
}

interface AdaptiveTutorial {
  id: string
  trigger: HesitationTrigger
  steps: TutorialStep[]
  userLevel: 'beginner' | 'intermediate' | 'expert'
  context: string
  priority: number
}

interface EnhancedGuidanceProps {
  type: 'tip' | 'warning' | 'success' | 'next-step' | 'hesitation-detected' | 'adaptive-tutorial' | 'smart-intervention'
  title: string
  message: string
  action?: {
    label: string
    onClick: () => void
  }
  onDismiss?: () => void
  position?: 'floating' | 'inline' | 'sidebar' | 'spotlight' | 'modal'
  priority?: number
  autoHide?: boolean
  delay?: number
  hesitationData?: UserBehaviorPattern
  tutorialSteps?: TutorialStep[]
  currentStep?: number
  userLevel?: 'beginner' | 'intermediate' | 'expert'
  interventionType?: 'gentle' | 'proactive' | 'immediate'
}

// Advanced Hesitation Detection Hook
const useAdvancedHesitationDetection = (
  onHesitationDetected: (pattern: UserBehaviorPattern, trigger: HesitationTrigger) => void,
  userLevel: 'beginner' | 'intermediate' | 'expert' = 'intermediate'
) => {
  const behaviorRef = useRef<UserBehaviorPattern>({
    mouseMovements: 0,
    clickAttempts: 0,
    timeOnPage: 0,
    scrollBacktrack: 0,
    formFieldFocusTime: 0,
    idleTime: 0,
    errorCount: 0,
    rapidNavigationCount: 0,
    lastActivity: Date.now()
  })
  
  const lastActivityRef = useRef(Date.now())
  const pageStartRef = useRef(Date.now())
  const lastScrollPositionRef = useRef(0)
  const fieldFocusStartRef = useRef<number | null>(null)
  const rapidNavigationRef = useRef(0)
  const lastNavigationRef = useRef(Date.now())
  
  // Define hesitation triggers based on user level
  const hesitationTriggers: HesitationTrigger[] = [
    {
      type: 'idle',
      threshold: userLevel === 'beginner' ? 8000 : userLevel === 'intermediate' ? 12000 : 20000,
      condition: (behavior) => behavior.idleTime > (userLevel === 'beginner' ? 8000 : 12000) && behavior.mouseMovements > 3,
      message: "I noticed you've paused here. Would you like some guidance?",
      urgency: 'medium'
    },
    {
      type: 'repetitive_clicks',
      threshold: userLevel === 'beginner' ? 5 : 8,
      condition: (behavior) => behavior.clickAttempts > (userLevel === 'beginner' ? 5 : 8) && behavior.timeOnPage < 30000,
      message: "Having trouble finding what you're looking for? Let me help.",
      urgency: 'high'
    },
    {
      type: 'field_focus_without_input',
      threshold: userLevel === 'beginner' ? 10000 : 15000,
      condition: (behavior) => behavior.formFieldFocusTime > (userLevel === 'beginner' ? 10000 : 15000) && behavior.clickAttempts < 3,
      message: "Not sure what to enter here? I can walk you through it.",
      urgency: 'high'
    },
    {
      type: 'rapid_navigation',
      threshold: 4,
      condition: (behavior) => behavior.rapidNavigationCount > 4,
      message: "You seem to be searching for something specific. Let me guide you.",
      urgency: 'medium'
    },
    {
      type: 'error_frequency',
      threshold: 3,
      condition: (behavior) => behavior.errorCount > 3,
      message: "I see you're running into some issues. Let me help resolve them.",
      urgency: 'high'
    }
  ]
  
  useEffect(() => {
    const trackMouseMovement = () => {
      behaviorRef.current.mouseMovements++
      behaviorRef.current.lastActivity = Date.now()
      lastActivityRef.current = Date.now()
    }
    
    const trackClicks = (e: MouseEvent) => {
      behaviorRef.current.clickAttempts++
      behaviorRef.current.lastActivity = Date.now()
      lastActivityRef.current = Date.now()
      
      // Track failed clicks (clicks that don't result in navigation or form submission)
      setTimeout(() => {
        if (e.target instanceof HTMLElement && 
            !e.target.closest('button, a, input, select, textarea') &&
            !e.target.onclick) {
          behaviorRef.current.errorCount++
        }
      }, 100)
    }
    
    const trackScroll = () => {
      const currentPosition = window.scrollY
      if (Math.abs(currentPosition - lastScrollPositionRef.current) > 100) {
        if (currentPosition < lastScrollPositionRef.current) {
          behaviorRef.current.scrollBacktrack++
        }
      }
      lastScrollPositionRef.current = currentPosition
      behaviorRef.current.lastActivity = Date.now()
      lastActivityRef.current = Date.now()
    }
    
    const trackFieldFocus = (e: FocusEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        fieldFocusStartRef.current = Date.now()
      }
    }
    
    const trackFieldBlur = (e: FocusEvent) => {
      if (fieldFocusStartRef.current && 
          (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        const focusTime = Date.now() - fieldFocusStartRef.current
        behaviorRef.current.formFieldFocusTime += focusTime
        fieldFocusStartRef.current = null
      }
    }
    
    const trackNavigation = () => {
      const now = Date.now()
      if (now - lastNavigationRef.current < 2000) {
        rapidNavigationRef.current++
        behaviorRef.current.rapidNavigationCount = rapidNavigationRef.current
      } else {
        rapidNavigationRef.current = 0
      }
      lastNavigationRef.current = now
    }
    
    const trackErrors = (e: ErrorEvent) => {
      behaviorRef.current.errorCount++
    }
    
    // Event listeners
    document.addEventListener('mousemove', trackMouseMovement, { passive: true })
    document.addEventListener('click', trackClicks)
    document.addEventListener('scroll', trackScroll, { passive: true })
    document.addEventListener('focusin', trackFieldFocus)
    document.addEventListener('focusout', trackFieldBlur)
    window.addEventListener('beforeunload', trackNavigation)
    window.addEventListener('error', trackErrors)
    
    // Hesitation pattern checker
    const hesitationChecker = setInterval(() => {
      const now = Date.now()
      const timeSinceActivity = now - lastActivityRef.current
      const totalTimeOnPage = now - pageStartRef.current
      
      behaviorRef.current.timeOnPage = totalTimeOnPage
      behaviorRef.current.idleTime = timeSinceActivity
      
      // Check each trigger condition
      hesitationTriggers.forEach(trigger => {
        if (trigger.condition(behaviorRef.current)) {
          onHesitationDetected(behaviorRef.current, trigger)
        }
      })
    }, 2000) // Check every 2 seconds for more responsive detection
    
    return () => {
      document.removeEventListener('mousemove', trackMouseMovement)
      document.removeEventListener('click', trackClicks)
      document.removeEventListener('scroll', trackScroll)
      document.removeEventListener('focusin', trackFieldFocus)
      document.removeEventListener('focusout', trackFieldBlur)
      window.removeEventListener('beforeunload', trackNavigation)
      window.removeEventListener('error', trackErrors)
      clearInterval(hesitationChecker)
    }
  }, [onHesitationDetected])
  
  return behaviorRef.current
}

// Enhanced Smart Guidance Component
export const EnhancedSmartGuidance: React.FC<EnhancedGuidanceProps> = ({
  type,
  title,
  message,
  action,
  onDismiss,
  position = 'floating',
  priority = 1,
  autoHide = false,
  delay = 0,
  hesitationData,
  tutorialSteps = [],
  currentStep = 0,
  userLevel = 'intermediate',
  interventionType = 'gentle'
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [tutorialActive, setTutorialActive] = useState(false)
  const [activeTutorialStep, setActiveTutorialStep] = useState(0)
  const [dismissed, setDismissed] = useState(false)
  
  useEffect(() => {
    if (dismissed) return
    
    const timer = setTimeout(() => {
      setIsVisible(true)
      setIsAnimating(true)
    }, delay)

    return () => clearTimeout(timer)
  }, [delay, dismissed])

  useEffect(() => {
    if (autoHide && isVisible && !tutorialActive) {
      const hideTimer = setTimeout(() => {
        handleDismiss()
      }, interventionType === 'immediate' ? 5000 : 10000)

      return () => clearTimeout(hideTimer)
    }
  }, [isVisible, autoHide, tutorialActive, interventionType])

  const handleDismiss = useCallback(() => {
    setIsAnimating(false)
    setDismissed(true)
    setTimeout(() => {
      setIsVisible(false)
      onDismiss?.()
    }, 300)
  }, [onDismiss])
  
  const startTutorial = useCallback(() => {
    setTutorialActive(true)
    setActiveTutorialStep(0)
  }, [])
  
  const nextTutorialStep = useCallback(() => {
    if (activeTutorialStep < tutorialSteps.length - 1) {
      setActiveTutorialStep(prev => prev + 1)
    } else {
      setTutorialActive(false)
      setActiveTutorialStep(0)
      handleDismiss()
    }
  }, [activeTutorialStep, tutorialSteps.length, handleDismiss])
  
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
      case 'hesitation-detected':
        return <HelpCircle className="h-5 w-5" />
      case 'adaptive-tutorial':
        return <Zap className="h-5 w-5" />
      case 'smart-intervention':
        return <Brain className="h-5 w-5" />
      default:
        return <Lightbulb className="h-5 w-5" />
    }
  }
  
  const getStyles = () => {
    const base = "transition-all duration-300 ease-in-out"
    
    switch (type) {
      case 'hesitation-detected':
        return {
          card: `${base} border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 shadow-xl ring-2 ring-amber-300/20`,
          icon: `text-amber-600 ${interventionType === 'immediate' ? 'animate-pulse' : ''}`,
          text: 'text-amber-800',
          button: 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600'
        }
      case 'adaptive-tutorial':
        return {
          card: `${base} border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50 shadow-xl`,
          icon: 'text-indigo-600',
          text: 'text-indigo-800',
          button: 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600'
        }
      case 'smart-intervention':
        return {
          card: `${base} border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 shadow-xl`,
          icon: 'text-emerald-600',
          text: 'text-emerald-800',
          button: 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600'
        }
      default:
        return {
          card: `${base} border-blue-200 bg-blue-50 shadow-lg`,
          icon: 'text-blue-600',
          text: 'text-blue-800',
          button: 'bg-blue-600 hover:bg-blue-700'
        }
    }
  }
  
  const getPositionStyles = () => {
    switch (position) {
      case 'floating':
        return `fixed bottom-4 right-4 z-50 max-w-sm ${
          isAnimating ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
        }`
      case 'modal':
        return `fixed inset-0 z-50 flex items-center justify-center ${
          isAnimating ? 'opacity-100' : 'opacity-0'
        }`
      case 'spotlight':
        return `fixed inset-0 z-50 flex items-center justify-center ${
          isAnimating ? 'opacity-100' : 'opacity-0'
        }`
      default:
        return `w-full ${
          isAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`
    }
  }
  
  const getAdaptiveMessage = () => {
    if (!hesitationData) return message
    
    const { idleTime, clickAttempts, formFieldFocusTime, scrollBacktrack, errorCount } = hesitationData
    
    if (errorCount > 3) {
      return "I noticed you're encountering some difficulties. Let me help you get back on track."
    }
    if (idleTime > 15000) {
      return "You've been here for a while. Would you like me to show you around?"
    }
    if (clickAttempts > 8) {
      return "It looks like you're trying to find something specific. I can guide you there."
    }
    if (formFieldFocusTime > 15000) {
      return "Having trouble with this form? Let me walk you through it step by step."
    }
    if (scrollBacktrack > 5) {
      return "I see you're searching through the page. Can I help you find what you need?"
    }
    
    return message
  }
  
  if (!isVisible || dismissed) return null

  const styles = getStyles()
  const displayMessage = type === 'hesitation-detected' ? getAdaptiveMessage() : message
  const urgencyLevel = hesitationData?.errorCount > 3 ? 'high' : hesitationData?.idleTime > 20000 ? 'medium' : 'low'

  return (
    <>
      {/* Overlay for modal/spotlight positioning */}
      {(position === 'modal' || position === 'spotlight') && (
        <motion.div 
          className=\"fixed inset-0 bg-black/50 z-40\"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}
      
      <motion.div 
        className={getPositionStyles()}
        initial={{ opacity: 0, scale: 0.9, y: position === 'floating' ? 20 : 0 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: position === 'floating' ? 20 : 0 }}
        transition={{ 
          type: \"spring\", 
          stiffness: 300, 
          damping: 30 
        }}
      >
        <Card className={`${styles.card} border-l-4 ${position === 'modal' || position === 'spotlight' ? 'max-w-md' : ''}`}>
          <CardHeader className=\"pb-3\">
            <div className=\"flex items-start justify-between\">
              <div className=\"flex items-center gap-2\">
                <motion.div 
                  className={styles.icon}
                  animate={
                    interventionType === 'immediate' || urgencyLevel === 'high' 
                      ? { scale: [1, 1.1, 1] } 
                      : {}
                  }
                  transition={{ 
                    repeat: interventionType === 'immediate' ? Infinity : 0, 
                    duration: 2 
                  }}
                >
                  {getIcon()}
                </motion.div>
                <CardTitle className={`text-sm ${styles.text}`}>
                  {title}
                </CardTitle>
                {(priority === 1 || urgencyLevel === 'high') && (
                  <Badge 
                    variant={urgencyLevel === 'high' ? 'destructive' : 'default'} 
                    className={`text-xs ${urgencyLevel === 'high' ? 'animate-pulse' : ''}`}
                  >
                    {urgencyLevel === 'high' ? 'Urgent Help' : type === 'hesitation-detected' ? 'Need Help?' : 'Important'}
                  </Badge>
                )}
              </div>
              {onDismiss && (
                <Button
                  variant=\"ghost\"
                  size=\"sm\"
                  onClick={handleDismiss}
                  className=\"h-6 w-6 p-0 hover:bg-transparent\"
                >
                  <X className=\"h-4 w-4\" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className=\"pt-0 space-y-4\">
            <p className={`text-sm ${styles.text}`}>
              {displayMessage}
            </p>
            
            {/* Behavioral insights for hesitation detection */}
            {type === 'hesitation-detected' && hesitationData && (
              <div className=\"grid grid-cols-2 gap-2 p-3 bg-amber-100/50 rounded-lg\">
                <div className=\"text-xs text-amber-700 flex items-center gap-1\">
                  <Timer className=\"w-3 h-3\" />
                  {Math.round(hesitationData.timeOnPage / 1000)}s on page
                </div>
                <div className=\"text-xs text-amber-700 flex items-center gap-1\">
                  <MousePointer className=\"w-3 h-3\" />
                  {hesitationData.clickAttempts} clicks
                </div>
                {hesitationData.errorCount > 0 && (
                  <div className=\"text-xs text-red-600 flex items-center gap-1\">
                    <AlertTriangle className=\"w-3 h-3\" />
                    {hesitationData.errorCount} issues
                  </div>
                )}
                <div className=\"text-xs text-amber-700 flex items-center gap-1\">
                  <Activity className=\"w-3 h-3\" />
                  {urgencyLevel} priority
                </div>
              </div>
            )}
            
            {/* Tutorial progress and steps */}
            {type === 'adaptive-tutorial' && tutorialSteps.length > 0 && (
              <div className=\"space-y-3\">
                <div className=\"flex items-center gap-2 text-xs text-indigo-600\">
                  <span>Step {activeTutorialStep + 1} of {tutorialSteps.length}</span>
                  <div className=\"flex-1 bg-indigo-200 rounded-full h-1\">
                    <motion.div 
                      className=\"bg-indigo-500 h-1 rounded-full\"
                      initial={{ width: 0 }}
                      animate={{ width: `${((activeTutorialStep + 1) / tutorialSteps.length) * 100}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
                {tutorialActive && tutorialSteps[activeTutorialStep] && (
                  <motion.div 
                    className=\"p-3 bg-indigo-50 rounded-lg border border-indigo-200\"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h4 className=\"font-medium text-sm text-indigo-800 mb-1\">
                      {tutorialSteps[activeTutorialStep].title}
                    </h4>
                    <p className=\"text-xs text-indigo-700 mb-2\">
                      {tutorialSteps[activeTutorialStep].content}
                    </p>
                    {tutorialSteps[activeTutorialStep].estimatedTime && (
                      <div className=\"text-xs text-indigo-600 flex items-center gap-1\">
                        <Clock className=\"w-3 h-3\" />
                        ~{tutorialSteps[activeTutorialStep].estimatedTime}s
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            )}
            
            {/* Action buttons */}
            <div className=\"flex gap-2\">
              {action && (
                <Button
                  onClick={action.onClick}
                  size=\"sm\"
                  className={`${styles.button} text-white flex-1`}
                >
                  {action.label}
                  <ArrowRight className=\"h-3 w-3 ml-1\" />
                </Button>
              )}
              
              {type === 'adaptive-tutorial' && (
                <Button
                  onClick={tutorialActive ? nextTutorialStep : startTutorial}
                  size=\"sm\"
                  className={`${styles.button} text-white flex-1`}
                >
                  {tutorialActive ? (
                    activeTutorialStep < tutorialSteps.length - 1 ? 'Next' : 'Finish'
                  ) : 'Start Tutorial'}
                  <ChevronRight className=\"h-3 w-3 ml-1\" />
                </Button>
              )}
              
              {type === 'hesitation-detected' && (
                <>
                  <Button 
                    onClick={startTutorial}
                    size=\"sm\"
                    className={`${styles.button} text-white flex-1`}
                  >
                    Guide me
                    <Eye className=\"h-3 w-3 ml-1\" />
                  </Button>
                  <Button 
                    onClick={handleDismiss}
                    size=\"sm\"
                    variant=\"outline\"
                    className=\"flex-1\"
                  >
                    I'm fine
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </>
  )
}

// Smart Guidance Manager with Advanced Detection
export const SmartGuidanceManager: React.FC<{
  currentPage: string
  userRole: string
  userLevel: 'beginner' | 'intermediate' | 'expert'
  children: React.ReactNode
}> = ({ currentPage, userRole, userLevel, children }) => {
  const [activeGuidance, setActiveGuidance] = useState<EnhancedGuidanceProps | null>(null)
  const [detectionActive, setDetectionActive] = useState(true)
  const [interventionCount, setInterventionCount] = useState(0)
  
  const handleHesitationDetected = useCallback((pattern: UserBehaviorPattern, trigger: HesitationTrigger) => {
    // Limit interventions to prevent annoyance
    if (interventionCount >= 3 || !detectionActive) return
    
    // Don't interrupt if user is actively working
    if (Date.now() - pattern.lastActivity < 2000) return
    
    setInterventionCount(prev => prev + 1)
    
    const tutorialSteps = getContextualTutorial(currentPage, userRole, trigger.type)
    const interventionType = trigger.urgency === 'high' ? 'immediate' : 
                           trigger.urgency === 'medium' ? 'proactive' : 'gentle'
    
    setActiveGuidance({
      type: 'hesitation-detected',
      title: trigger.urgency === 'high' ? 'Let me help!' : 'Need assistance?',
      message: trigger.message,
      position: interventionType === 'immediate' ? 'modal' : 'floating',
      priority: trigger.urgency === 'high' ? 1 : 2,
      hesitationData: pattern,
      onDismiss: () => {
        setActiveGuidance(null)
        // Reduce detection sensitivity after dismissal
        if (interventionCount >= 2) {
          setDetectionActive(false)
          setTimeout(() => setDetectionActive(true), 300000) // 5 minutes
        }
      },
      tutorialSteps,
      userLevel,
      interventionType
    })
  }, [currentPage, userRole, userLevel, interventionCount, detectionActive])
  
  // Use advanced hesitation detection
  useAdvancedHesitationDetection(handleHesitationDetected, userLevel)
  
  const getContextualTutorial = (page: string, role: string, triggerType: string): TutorialStep[] => {
    if (page === '/dashboard/coach' && role === 'coach') {
      return [
        {
          title: 'Coach Dashboard Overview',
          content: 'This dashboard shows your network performance and helps you focus on what matters most.',
          type: 'tooltip',
          estimatedTime: 15
        },
        {
          title: 'Priority Actions',
          content: 'Start with urgent messages and agencies needing attention - they impact your revenue directly.',
          type: 'tooltip',
          estimatedTime: 20
        },
        {
          title: 'Growth Opportunities',
          content: 'Use the community link generator to expand your network and increase monthly earnings.',
          type: 'tooltip',
          estimatedTime: 25
        }
      ]
    }
    
    if (page.includes('/projects') && role === 'agency') {
      if (triggerType === 'field_focus_without_input') {
        return [
          {
            title: 'Project Creation Tips',
            content: 'Start with your client\'s main goal, then break it into specific deliverables.',
            type: 'tooltip',
            estimatedTime: 30
          },
          {
            title: 'Setting Realistic Timelines',
            content: 'Add 20% buffer time to your estimates - clients appreciate when you deliver early.',
            type: 'tooltip',
            estimatedTime: 25
          }
        ]
      }
      
      return [
        {
          title: 'Project Management Basics',
          content: 'Track client work, deadlines, and team progress all in one place.',
          type: 'tooltip',
          estimatedTime: 20
        },
        {
          title: 'Creating Your First Project',
          content: 'Click "New Project" and I\'ll walk you through each step.',
          type: 'tooltip',
          estimatedTime: 15
        }
      ]
    }
    
    // Generic fallback tutorial
    return [
      {
        title: 'Getting Oriented',
        content: 'This page helps you manage your work efficiently. Let me show you the key areas.',
        type: 'tooltip',
        estimatedTime: 20
      },
      {
        title: 'Next Steps',
        content: 'Focus on the most important actions first - they\'re highlighted for you.',
        type: 'tooltip',
        estimatedTime: 15
      }
    ]
  }
  
  return (
    <div className=\"relative\">
      {children}
      <AnimatePresence>
        {activeGuidance && detectionActive && (
          <EnhancedSmartGuidance
            {...activeGuidance}
          />
        )}
      </AnimatePresence>
    </div>
  )
}