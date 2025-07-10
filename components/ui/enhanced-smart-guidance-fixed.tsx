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
  target?: string
  type: 'tooltip' | 'modal' | 'spotlight' | 'overlay'
  action?: {
    label: string
    onClick: () => void
  }
  estimatedTime?: number
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
    }
  ]
  
  useEffect(() => {
    const trackMouseMovement = () => {
      behaviorRef.current.mouseMovements++
      behaviorRef.current.lastActivity = Date.now()
      lastActivityRef.current = Date.now()
    }
    
    const trackClicks = () => {
      behaviorRef.current.clickAttempts++
      behaviorRef.current.lastActivity = Date.now()
      lastActivityRef.current = Date.now()
    }
    
    document.addEventListener('mousemove', trackMouseMovement, { passive: true })
    document.addEventListener('click', trackClicks)
    
    const hesitationChecker = setInterval(() => {
      const now = Date.now()
      const timeSinceActivity = now - lastActivityRef.current
      const totalTimeOnPage = now - pageStartRef.current
      
      behaviorRef.current.timeOnPage = totalTimeOnPage
      behaviorRef.current.idleTime = timeSinceActivity
      
      hesitationTriggers.forEach(trigger => {
        if (trigger.condition(behaviorRef.current)) {
          onHesitationDetected(behaviorRef.current, trigger)
        }
      })
    }, 2000)
    
    return () => {
      document.removeEventListener('mousemove', trackMouseMovement)
      document.removeEventListener('click', trackClicks)
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
  const [dismissed, setDismissed] = useState(false)
  
  useEffect(() => {
    if (dismissed) return
    
    const timer = setTimeout(() => {
      setIsVisible(true)
      setIsAnimating(true)
    }, delay)

    return () => clearTimeout(timer)
  }, [delay, dismissed])

  const handleDismiss = useCallback(() => {
    setIsAnimating(false)
    setDismissed(true)
    setTimeout(() => {
      setIsVisible(false)
      onDismiss?.()
    }, 300)
  }, [onDismiss])
  
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
      default:
        return {
          card: `${base} border-blue-200 bg-blue-50 shadow-lg`,
          icon: 'text-blue-600',
          text: 'text-blue-800',
          button: 'bg-blue-600 hover:bg-blue-700'
        }
    }
  }
  
  const getAdaptiveMessage = () => {
    if (!hesitationData) return message
    
    const { idleTime, clickAttempts, errorCount } = hesitationData
    
    if (errorCount > 3) {
      return "I noticed you're encountering some difficulties. Let me help you get back on track."
    }
    if (idleTime > 15000) {
      return "You've been here for a while. Would you like me to show you around?"
    }
    if (clickAttempts > 8) {
      return "It looks like you're trying to find something specific. I can guide you there."
    }
    
    return message
  }
  
  if (!isVisible || dismissed) return null

  const styles = getStyles()
  const displayMessage = type === 'hesitation-detected' ? getAdaptiveMessage() : message

  return (
    <>
      {(position === 'modal' || position === 'spotlight') && (
        <motion.div 
          className="fixed inset-0 bg-black/50 z-40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}
      
      <motion.div 
        className={`${
          position === 'floating' 
            ? `fixed bottom-4 right-4 z-50 max-w-sm ${isAnimating ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`
            : position === 'modal' || position === 'spotlight'
            ? `fixed inset-0 z-50 flex items-center justify-center ${isAnimating ? 'opacity-100' : 'opacity-0'}`
            : `w-full ${isAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`
        }`}
        initial={{ opacity: 0, scale: 0.9, y: position === 'floating' ? 20 : 0 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: position === 'floating' ? 20 : 0 }}
        transition={{ 
          type: "spring", 
          stiffness: 300, 
          damping: 30 
        }}
      >
        <Card className={`${styles.card} border-l-4 ${position === 'modal' || position === 'spotlight' ? 'max-w-md' : ''}`}>
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
          <CardContent className="pt-0 space-y-4">
            <p className={`text-sm ${styles.text}`}>
              {displayMessage}
            </p>
            
            {type === 'hesitation-detected' && hesitationData && (
              <div className="grid grid-cols-2 gap-2 p-3 bg-amber-100/50 rounded-lg">
                <div className="text-xs text-amber-700 flex items-center gap-1">
                  <Timer className="w-3 h-3" />
                  {Math.round(hesitationData.timeOnPage / 1000)}s on page
                </div>
                <div className="text-xs text-amber-700 flex items-center gap-1">
                  <MousePointer className="w-3 h-3" />
                  {hesitationData.clickAttempts} clicks
                </div>
              </div>
            )}
            
            <div className="flex gap-2">
              {action && (
                <Button 
                  onClick={action.onClick}
                  size="sm"
                  className={`${styles.button} text-white flex-1`}
                >
                  {action.label}
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              )}
              
              {type === 'hesitation-detected' && (
                <Button 
                  onClick={handleDismiss}
                  size="sm"
                  variant="outline"
                  className="flex-1"
                >
                  I'm fine
                </Button>
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
    if (interventionCount >= 3 || !detectionActive) return
    
    if (Date.now() - pattern.lastActivity < 2000) return
    
    setInterventionCount(prev => prev + 1)
    
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
        if (interventionCount >= 2) {
          setDetectionActive(false)
          setTimeout(() => setDetectionActive(true), 300000)
        }
      },
      userLevel,
      interventionType
    })
  }, [currentPage, userRole, userLevel, interventionCount, detectionActive])
  
  useAdvancedHesitationDetection(handleHesitationDetected, userLevel)
  
  return (
    <div className="relative">
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