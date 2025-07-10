'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Bot, 
  BarChart3, 
  Zap, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle, 
  Clock,
  DollarSign,
  Users,
  Lightbulb,
  Target
} from 'lucide-react'

interface ProjectWizardProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (projectData: any) => void
  userRole: string
  previousProjects?: any[]
}

interface ProjectData {
  type: string
  name: string
  clientName: string
  description: string
  timeline: string
  budget: string
  priority: string
  teamSize: string
}

const ProjectWizard: React.FC<ProjectWizardProps> = ({ 
  isOpen, 
  onClose, 
  onComplete, 
  userRole,
  previousProjects = []
}) => {
  const [step, setStep] = useState(1)
  const [data, setData] = useState<ProjectData>({
    type: '',
    name: '',
    clientName: '',
    description: '',
    timeline: '',
    budget: '',
    priority: '',
    teamSize: ''
  })
  const [guidance, setGuidance] = useState('')
  const [confidence, setConfidence] = useState(0)

  // Smart guidance based on user input
  useEffect(() => {
    updateGuidance()
    updateConfidence()
  }, [data, step])

  const updateGuidance = () => {
    if (step === 1 && !data.type) {
      setGuidance('💡 Most agencies start with chatbots - they\'re easier to scope and deliver')
    } else if (step === 2 && data.clientName && !data.name) {
      setGuidance(`💡 Try "${data.clientName} ${data.type === 'chatbot' ? 'Customer Service Bot' : data.type === 'analytics' ? 'Analytics Dashboard' : 'Workflow Automation'}"`)
    } else if (step === 3 && data.budget) {
      const budget = parseInt(data.budget.replace(/[^0-9]/g, ''))
      if (budget < 5000) {
        setGuidance('⚠️ Consider: AI projects typically need $5K+ for quality delivery')
      } else if (budget > 25000) {
        setGuidance('🎯 Excellent! This budget allows for comprehensive AI solutions')
      } else {
        setGuidance('✅ Good budget range for professional AI implementation')
      }
    } else {
      setGuidance('')
    }
  }

  const updateConfidence = () => {
    let conf = 0
    if (data.type) conf += 20
    if (data.clientName) conf += 15
    if (data.name) conf += 15
    if (data.description) conf += 20
    if (data.timeline) conf += 15
    if (data.budget) conf += 15
    setConfidence(conf)
  }

  const projectTypes = [
    {
      id: 'chatbot',
      title: 'AI Chatbot',
      description: 'Customer service automation',
      icon: Bot,
      color: 'blue',
      timeline: '4-6 weeks',
      complexity: 'Beginner Friendly',
      avgBudget: '$8,000-15,000'
    },
    {
      id: 'analytics',
      title: 'AI Analytics',
      description: 'Data analysis & insights',
      icon: BarChart3,
      color: 'green',
      timeline: '6-8 weeks',
      complexity: 'Intermediate',
      avgBudget: '$12,000-25,000'
    },
    {
      id: 'automation',
      title: 'Workflow Automation',
      description: 'Process automation',
      icon: Zap,
      color: 'purple',
      timeline: '8-12 weeks',
      complexity: 'Advanced',
      avgBudget: '$15,000-35,000'
    }
  ]

  const getRecommendedType = () => {
    if (previousProjects.length === 0) return 'chatbot'
    if (previousProjects.filter(p => p.type === 'chatbot').length >= 2) return 'analytics'
    return 'chatbot'
  }

  const getSmartDefaults = () => {
    const recommended = getRecommendedType()
    const projectType = projectTypes.find(t => t.id === recommended)
    
    return {
      timeline: projectType?.timeline || '4-6 weeks',
      budget: projectType?.avgBudget.split('-')[0] || '$8,000'
    }
  }

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1)
      
      // Auto-fill smart defaults on step 3
      if (step === 2) {
        const defaults = getSmartDefaults()
        if (!data.timeline) {
          setData(prev => ({ ...prev, timeline: defaults.timeline }))
        }
        if (!data.budget) {
          setData(prev => ({ ...prev, budget: defaults.budget }))
        }
      }
    } else {
      onComplete(data)
    }
  }

  const canProceed = () => {
    switch (step) {
      case 1: return data.type !== ''
      case 2: return data.clientName !== '' && data.name !== ''
      case 3: return data.timeline !== '' && data.budget !== ''
      case 4: return data.description !== ''
      default: return false
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Create New Project</CardTitle>
            <div className="flex items-center gap-4">
              <div className="flex space-x-1">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      i <= step 
                        ? 'bg-blue-500 scale-110' 
                        : i === step + 1 
                        ? 'bg-blue-200 animate-pulse' 
                        : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
              <Button variant="ghost" onClick={onClose}>×</Button>
            </div>
          </div>
          <Progress value={(step / 4) * 100} className="mt-2" />
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Step 1: Project Type */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">What type of AI project is this?</h3>
                <p className="text-muted-foreground">Choose the best fit for your client's needs</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {projectTypes.map((type) => {
                  const Icon = type.icon
                  const isRecommended = type.id === getRecommendedType()
                  
                  return (
                    <Card
                      key={type.id}
                      className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
                        data.type === type.id 
                          ? 'border-blue-500 bg-blue-50 shadow-lg ring-2 ring-blue-200' 
                          : isRecommended
                          ? 'border-green-500 bg-green-50 shadow-md ring-1 ring-green-200'
                          : 'hover:border-blue-300 hover:shadow-md'
                      }`}
                      onClick={() => setData(prev => ({ ...prev, type: type.id }))}
                    >
                      <CardContent className="p-6 text-center relative">
                        {isRecommended && (
                          <Badge className="absolute -top-2 -right-2 bg-green-500 animate-pulse">
                            Recommended
                          </Badge>
                        )}
                        <Icon className={`h-12 w-12 mx-auto mb-4 text-${type.color}-500`} />
                        <h4 className="font-semibold mb-2">{type.title}</h4>
                        <p className="text-sm text-muted-foreground mb-3">{type.description}</p>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span>Timeline:</span>
                            <span className="font-medium">{type.timeline}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Complexity:</span>
                            <span className="font-medium">{type.complexity}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Budget:</span>
                            <span className="font-medium">{type.avgBudget}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
              
              {guidance && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">{guidance}</p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Basic Info */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Tell us about this project</h3>
                <p className="text-muted-foreground">Basic information to get started</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="clientName">Client Name</Label>
                  <Input
                    id="clientName"
                    placeholder="e.g., TechCorp"
                    value={data.clientName}
                    onChange={(e) => setData(prev => ({ ...prev, clientName: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="projectName">Project Name</Label>
                  <Input
                    id="projectName"
                    placeholder={data.clientName ? `${data.clientName} AI Project` : "Project name"}
                    value={data.name}
                    onChange={(e) => setData(prev => ({ ...prev, name: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>

              {guidance && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">{guidance}</p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Scope & Budget */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Project scope and timeline</h3>
                <p className="text-muted-foreground">Let's set realistic expectations</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="timeline">Timeline</Label>
                  <Select value={data.timeline} onValueChange={(value) => setData(prev => ({ ...prev, timeline: value }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="How long will this take?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2-3 weeks">Rush (2-3 weeks)</SelectItem>
                      <SelectItem value="4-6 weeks">Standard (4-6 weeks)</SelectItem>
                      <SelectItem value="8-12 weeks">Comprehensive (8-12 weeks)</SelectItem>
                      <SelectItem value="3+ months">Enterprise (3+ months)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="budget">Budget Range</Label>
                  <Select value={data.budget} onValueChange={(value) => setData(prev => ({ ...prev, budget: value }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Project budget" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="$3,000-5,000">$3,000-5,000</SelectItem>
                      <SelectItem value="$5,000-10,000">$5,000-10,000</SelectItem>
                      <SelectItem value="$10,000-20,000">$10,000-20,000</SelectItem>
                      <SelectItem value="$20,000-50,000">$20,000-50,000</SelectItem>
                      <SelectItem value="$50,000+">$50,000+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {guidance && (
                <div className={`p-3 rounded-lg border ${
                  guidance.includes('⚠️') 
                    ? 'bg-orange-50 border-orange-200' 
                    : guidance.includes('🎯') 
                    ? 'bg-green-50 border-green-200'
                    : 'bg-blue-50 border-blue-200'
                }`}>
                  <p className={`text-sm ${
                    guidance.includes('⚠️') 
                      ? 'text-orange-800' 
                      : guidance.includes('🎯') 
                      ? 'text-green-800'
                      : 'text-blue-800'
                  }`}>
                    {guidance}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Description */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Describe the project goals</h3>
                <p className="text-muted-foreground">What should this AI system accomplish?</p>
              </div>

              <div>
                <Label htmlFor="description">Project Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what the client needs, their main challenges, and how AI will help..."
                  value={data.description}
                  onChange={(e) => setData(prev => ({ ...prev, description: e.target.value }))}
                  className="mt-1 min-h-[120px]"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  💡 Tip: Include specific business problems and expected outcomes
                </p>
              </div>

              {/* Project Summary */}
              <Card className="bg-gray-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Project Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Type:</span>
                    <span className="font-medium">{projectTypes.find(t => t.id === data.type)?.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Client:</span>
                    <span className="font-medium">{data.clientName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Timeline:</span>
                    <span className="font-medium">{data.timeline}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Budget:</span>
                    <span className="font-medium">{data.budget}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center pt-6 border-t">
            <Button
              variant="outline"
              onClick={() => setStep(step - 1)}
              disabled={step === 1}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>

            <div className="flex items-center gap-3">
              {confidence > 0 && (
                <div className="text-sm text-muted-foreground">
                  {confidence}% complete
                </div>
              )}
              
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className={`transition-all duration-300 ${
                  canProceed() 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:scale-105 shadow-lg' 
                    : ''
                }`}
              >
                {step === 4 ? (
                  <>
                    Create Project
                    <CheckCircle className="h-4 w-4 ml-2" />
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ProjectWizard