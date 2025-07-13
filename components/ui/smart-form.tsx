'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useSmartDefaults } from '@/hooks/useContextualGuidance'
import { 
  CheckCircle, 
  AlertTriangle, 
  Lightbulb
} from 'lucide-react'

interface SmartInputProps {
  field: string
  label: string
  placeholder?: string
  type?: 'text' | 'email' | 'number' | 'textarea' | 'select'
  options?: Array<{ value: string; label: string; recommended?: boolean }>
  value: string
  onChange: (value: string) => void
  context?: Record<string, unknown>
  validation?: {
    required?: boolean
    minLength?: number
    maxLength?: number
    pattern?: RegExp
    custom?: (value: string) => string | null
  }
}

export const SmartInput: React.FC<SmartInputProps> = ({
  field,
  label,
  placeholder,
  type = 'text',
  options = [],
  value,
  onChange,
  context = {},
  validation = {}
}) => {
  const [guidance, setGuidance] = useState('')
  const [guidanceType, setGuidanceType] = useState<'tip' | 'warning' | 'success' | 'info'>('info')
  const [isValid, setIsValid] = useState(true)
  const [showValidation, setShowValidation] = useState(false)

  // Real-time guidance based on field and value
  useEffect(() => {
    updateGuidance()
    validateField()
  }, [value, field, context, updateGuidance, validateField])

  const updateGuidance = useCallback(() => {
    if (field === 'budget' && value) {
      const numValue = parseInt(value.replace(/[^0-9]/g, ''))
      if (numValue < 5000) {
        setGuidance('💡 Consider: AI projects typically need $5K+ for quality delivery')
        setGuidanceType('warning')
      } else if (numValue > 50000) {
        setGuidance('🎯 Excellent! This budget allows for comprehensive solutions')
        setGuidanceType('success')
      } else if (numValue >= 5000 && numValue <= 50000) {
        setGuidance('✅ Good budget range for professional AI implementation')
        setGuidanceType('success')
      } else {
        setGuidance('')
      }
    } else if (field === 'timeline' && value) {
      if (value.includes('2-3 weeks') || value.includes('Rush')) {
        setGuidance('⚠️ Rush timelines may impact quality. Consider adding buffer time.')
        setGuidanceType('warning')
      } else if (value.includes('8-12 weeks') || value.includes('3+ months')) {
        setGuidance('📈 Longer timelines allow for more comprehensive solutions')
        setGuidanceType('success')
      } else {
        setGuidance('⏱️ Good timeline for quality delivery')
        setGuidanceType('success')
      }
    } else if (field === 'clientName' && value && value.length > 2) {
      setGuidance('💼 Great! Clear client identification helps with organization')
      setGuidanceType('success')
    } else if (field === 'projectName' && value && context.clientName) {
      if (!value.toLowerCase().includes(context.clientName.toLowerCase())) {
        setGuidance(`💡 Consider including "${context.clientName}" in the project name`)
        setGuidanceType('tip')
      } else {
        setGuidance('✅ Perfect! Client name in project title aids organization')
        setGuidanceType('success')
      }
    } else if (field === 'description' && value) {
      const wordCount = value.split(' ').length
      if (wordCount < 10) {
        setGuidance('📝 Add more details about client needs and expected outcomes')
        setGuidanceType('tip')
      } else if (wordCount > 100) {
        setGuidance('📏 Consider breaking this into smaller, focused sections')
        setGuidanceType('tip')
      } else {
        setGuidance('👍 Good level of detail for project scope')
        setGuidanceType('success')
      }
    } else {
      setGuidance('')
    }
  }, [value, field, context])

  const validateField = useCallback(() => {
    let valid = true
    
    if (validation.required && !value.trim()) {
      valid = false
    }
    
    if (validation.minLength && value.length < validation.minLength) {
      valid = false
    }
    
    if (validation.maxLength && value.length > validation.maxLength) {
      valid = false
    }
    
    if (validation.pattern && !validation.pattern.test(value)) {
      valid = false
    }
    
    if (validation.custom) {
      const customError = validation.custom(value)
      if (customError) {
        valid = false
      }
    }
    
    setIsValid(valid)
    setShowValidation(value.length > 0)
  }, [value, validation])

  const getInputClassName = () => {
    let baseClass = "transition-all duration-200"
    
    if (showValidation) {
      if (isValid && value.length > 0) {
        baseClass += " border-green-300 focus:border-green-500 focus:ring-green-200"
      } else if (!isValid) {
        baseClass += " border-red-300 focus:border-red-500 focus:ring-red-200"
      }
    }
    
    return baseClass
  }

  const getGuidanceClassName = () => {
    const baseClass = "text-xs mt-1 transition-all duration-200"
    
    switch (guidanceType) {
      case 'success':
        return `${baseClass} text-green-600`
      case 'warning':
        return `${baseClass} text-orange-600`
      case 'tip':
        return `${baseClass} text-blue-600`
      default:
        return `${baseClass} text-muted-foreground`
    }
  }

  const renderInput = () => {
    switch (type) {
      case 'textarea':
        return (
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={getInputClassName()}
            rows={4}
          />
        )
      
      case 'select':
        return (
          <Select value={value} onValueChange={onChange}>
            <SelectTrigger className={getInputClassName()}>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem 
                  key={option.value} 
                  value={option.value}
                  className={option.recommended ? 'bg-blue-50 border border-blue-200' : ''}
                >
                  <div className="flex items-center justify-between w-full">
                    {option.label}
                    {option.recommended && (
                      <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-800">
                        Recommended
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      
      default:
        return (
          <Input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={getInputClassName()}
          />
        )
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={field} className="text-sm font-medium">
        {label}
        {validation.required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      
      <div className="relative">
        {renderInput()}
        
        {/* Success indicator */}
        {showValidation && isValid && value.length > 0 && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <CheckCircle className="h-4 w-4 text-green-500" />
          </div>
        )}
        
        {/* Error indicator */}
        {showValidation && !isValid && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </div>
        )}
      </div>
      
      {/* Guidance text */}
      {guidance && (
        <p className={getGuidanceClassName()}>
          {guidance}
        </p>
      )}
    </div>
  )
}

interface SmartFormProps {
  title: string
  description?: string
  fields: Array<{
    name: string
    label: string
    type?: 'text' | 'email' | 'number' | 'textarea' | 'select'
    placeholder?: string
    options?: Array<{ value: string; label: string; recommended?: boolean }>
    validation?: {
      required?: boolean
      minLength?: number
      maxLength?: number
      pattern?: RegExp
      custom?: (value: string) => string | null
    }
    showWhen?: (data: Record<string, unknown>) => boolean
  }>
  onSubmit: (data: Record<string, unknown>) => void
  onCancel?: () => void
  submitLabel?: string
  context?: Record<string, unknown>
}

export const SmartForm: React.FC<SmartFormProps> = ({
  title,
  description,
  fields,
  onSubmit,
  onCancel,
  submitLabel = 'Submit',
  context = {}
}) => {
  const [data, setData] = useState<Record<string, string>>({})
  const [completionProgress, setCompletionProgress] = useState(0)
  const { defaults } = useSmartDefaults({ ...context, currentForm: 'smart_form' })

  // Apply smart defaults when they become available
  useEffect(() => {
    const newData = { ...data }
    let hasChanges = false
    
    Object.keys(defaults).forEach(key => {
      if (!data[key] && defaults[key]) {
        newData[key] = defaults[key]
        hasChanges = true
      }
    })
    
    if (hasChanges) {
      setData(newData)
    }
  }, [defaults, data])

  // Calculate completion progress
  useEffect(() => {
    const visibleFields = fields.filter(field => 
      !field.showWhen || field.showWhen(data)
    )
    const completedFields = visibleFields.filter(field => 
      data[field.name] && data[field.name].trim().length > 0
    )
    
    const progress = visibleFields.length > 0 
      ? (completedFields.length / visibleFields.length) * 100 
      : 0
    
    setCompletionProgress(progress)
  }, [data, fields])

  const handleFieldChange = (fieldName: string, value: string) => {
    setData(prev => ({
      ...prev,
      [fieldName]: value
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(data)
  }

  const canSubmit = () => {
    const requiredFields = fields.filter(field => 
      field.validation?.required && (!field.showWhen || field.showWhen(data))
    )
    
    return requiredFields.every(field => 
      data[field.name] && data[field.name].trim().length > 0
    )
  }

  const visibleFields = fields.filter(field => 
    !field.showWhen || field.showWhen(data)
  )

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="space-y-2">
          <CardTitle>{title}</CardTitle>
          {description && <p className="text-muted-foreground">{description}</p>}
          
          {/* Progress indicator */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{Math.round(completionProgress)}% complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${completionProgress}%` }}
              ></div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {visibleFields.map((field) => (
            <SmartInput
              key={field.name}
              field={field.name}
              label={field.label}
              type={field.type}
              placeholder={field.placeholder}
              options={field.options}
              value={data[field.name] || ''}
              onChange={(value) => handleFieldChange(field.name, value)}
              context={data}
              validation={field.validation}
            />
          ))}
          
          {/* Smart suggestions based on form state */}
          {completionProgress > 50 && completionProgress < 100 && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-800 text-sm">You&apos;re almost done!</h4>
                    <p className="text-blue-700 text-sm">
                      Just a few more fields and you&apos;ll have everything set up perfectly.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          <div className="flex justify-between pt-4">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            
            <Button 
              type="submit" 
              disabled={!canSubmit()}
              className={`ml-auto transition-all duration-300 ${
                canSubmit() 
                  ? 'bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 shadow-lg hover:shadow-xl transform hover:scale-105' 
                  : ''
              }`}
            >
              {submitLabel}
              {canSubmit() && <CheckCircle className="ml-2 h-4 w-4" />}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

// Usage example component
export const ProjectCreationForm: React.FC<{
  onSubmit: (data: Record<string, unknown>) => void
  onCancel: () => void
  context?: Record<string, unknown>
}> = ({ onSubmit, onCancel, context = {} }) => {
  const fields = [
    {
      name: 'clientName',
      label: 'Client Name',
      placeholder: 'e.g., TechCorp',
      validation: { required: true, minLength: 2 }
    },
    {
      name: 'projectName',
      label: 'Project Name',
      placeholder: 'e.g., Customer Service AI Bot',
      validation: { required: true, minLength: 5 }
    },
    {
      name: 'projectType',
      label: 'Project Type',
      type: 'select' as const,
      options: [
        { value: 'chatbot', label: 'AI Chatbot', recommended: true },
        { value: 'analytics', label: 'AI Analytics' },
        { value: 'automation', label: 'Workflow Automation' }
      ],
      validation: { required: true }
    },
    {
      name: 'budget',
      label: 'Budget Range',
      type: 'select' as const,
      options: [
        { value: '$3,000-5,000', label: '$3,000-5,000' },
        { value: '$5,000-10,000', label: '$5,000-10,000', recommended: true },
        { value: '$10,000-20,000', label: '$10,000-20,000' },
        { value: '$20,000-50,000', label: '$20,000-50,000' },
        { value: '$50,000+', label: '$50,000+' }
      ],
      validation: { required: true }
    },
    {
      name: 'timeline',
      label: 'Timeline',
      type: 'select' as const,
      options: [
        { value: '2-3 weeks', label: 'Rush (2-3 weeks)' },
        { value: '4-6 weeks', label: 'Standard (4-6 weeks)', recommended: true },
        { value: '8-12 weeks', label: 'Comprehensive (8-12 weeks)' },
        { value: '3+ months', label: 'Enterprise (3+ months)' }
      ],
      validation: { required: true }
    },
    {
      name: 'description',
      label: 'Project Description',
      type: 'textarea' as const,
      placeholder: 'Describe the client\'s needs, challenges, and how AI will help...',
      validation: { required: true, minLength: 20 }
    }
  ]

  return (
    <SmartForm
      title="Create New Project"
      description="Let's set up your AI project with smart guidance"
      fields={fields}
      onSubmit={onSubmit}
      onCancel={onCancel}
      submitLabel="Create Project"
      context={context}
    />
  )
}