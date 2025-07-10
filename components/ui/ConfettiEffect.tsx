'use client'

import React, { useEffect, useRef } from 'react'
import confetti from 'canvas-confetti'

interface ConfettiEffectProps {
  show: boolean
  onAnimationComplete?: () => void
}

const ConfettiEffect: React.FC<ConfettiEffectProps> = ({ show, onAnimationComplete }) => {
  const animationInstance = useRef<any>(null)

  useEffect(() => {
    if (show) {
      animationInstance.current = confetti.create(undefined, {
        resize: true,
        useWorker: true
      })

      animationInstance.current({
        particleCount: 25,
        spread: 35,
        origin: { y: 0.6 }
      })

      const timer = setTimeout(() => {
        if (onAnimationComplete) {
          onAnimationComplete()
        }
      }, 1200) // Stop confetti after 1.2 seconds

      return () => {
        clearTimeout(timer)
        if (animationInstance.current) {
          animationInstance.current.reset()
        }
      }
    }
  }, [show, onAnimationComplete])

  return null
}

export default ConfettiEffect