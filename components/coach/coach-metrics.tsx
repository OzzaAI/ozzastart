'use client'

import { useState, useEffect } from 'react'
import { useTranslations, useFormatter } from 'next-intl'
import { TrendingUp, TrendingDown, DollarSign, Users, Target, BarChart3 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Progress } from '../ui/progress'
import { useAccessibility } from '../providers/accessibility-provider'
import { trackEvent } from '../../lib/monitoring'

interface MetricData {
  id: string
  value: number
  previousValue: number
  target?: number
  unit: 'currency' | 'percentage' | 'number'
  trend: 'up' | 'down' | 'neutral'
  period: 'daily' | 'weekly' | 'monthly' | 'yearly'
}

interface CoachMetricsProps {
  userId: string
  timeRange?: '7d' | '30d' | '90d' | '1y'
  className?: string
}

export function CoachMetrics({ userId, timeRange = '30d', className = '' }: CoachMetricsProps) {
  const [metrics, setMetrics] = useState<MetricData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null)
  
  const t = useTranslations('coach')
  const format = useFormatter()
  const { announce } = useAccessibility()

  // Mock data - replace with actual API call
  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true)
      
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        const mockMetrics: MetricData[] = [
          {
            id: 'revenue',
            value: 12500,
            previousValue: 10800,
            target: 15000,
            unit: 'currency',
            trend: 'up',
            period: 'monthly'
          },
          {
            id: 'conversion',
            value: 3.2,
            previousValue: 2.8,
            target: 5.0,
            unit: 'percentage',
            trend: 'up',
            period: 'monthly'
          },
          {
            id: 'retention',
            value: 85.5,
            previousValue: 87.2,
            target: 90.0,
            unit: 'percentage',
            trend: 'down',
            period: 'monthly'
          },
          {
            id: 'customerLifetimeValue',
            value: 2400,
            previousValue: 2200,
            unit: 'currency',
            trend: 'up',
            period: 'monthly'
          },
          {
            id: 'customerAcquisitionCost',
            value: 180,
            previousValue: 220,
            target: 150,
            unit: 'currency',
            trend: 'up', // Lower CAC is better, so this is positive
            period: 'monthly'
          },
          {
            id: 'monthlyRecurringRevenue',
            value: 45000,
            previousValue: 42000,
            target: 50000,
            unit: 'currency',
            trend: 'up',
            period: 'monthly'
          }
        ]
        
        setMetrics(mockMetrics)
        
        // Track metrics view
        await trackEvent('coach_metrics_viewed', {
          userId,
          timeRange,
          metricsCount: mockMetrics.length
        })
        
      } catch (error) {
        console.error('Failed to fetch coach metrics:', error)
        announce(t('error') || 'Failed to load metrics', 'assertive')
      } finally {
        setLoading(false)
      }
    }

    fetchMetrics()
  }, [userId, timeRange, t, announce])

  const formatValue = (metric: MetricData): string => {
    switch (metric.unit) {
      case 'currency':
        return format.number(metric.value, {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        })
      case 'percentage':
        return format.number(metric.value / 100, {
          style: 'percent',
          minimumFractionDigits: 1,
          maximumFractionDigits: 1
        })
      case 'number':
        return format.number(metric.value)
      default:
        return metric.value.toString()
    }
  }

  const calculateChange = (metric: MetricData): number => {
    if (metric.previousValue === 0) return 0
    return ((metric.value - metric.previousValue) / metric.previousValue) * 100
  }

  const calculateProgress = (metric: MetricData): number => {
    if (!metric.target) return 0
    return Math.min((metric.value / metric.target) * 100, 100)
  }

  const getMetricIcon = (metricId: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      revenue: <DollarSign className="h-4 w-4" />,
      conversion: <Target className="h-4 w-4" />,
      retention: <Users className="h-4 w-4" />,
      customerLifetimeValue: <TrendingUp className="h-4 w-4" />,
      customerAcquisitionCost: <BarChart3 className="h-4 w-4" />,
      monthlyRecurringRevenue: <DollarSign className="h-4 w-4" />
    }
    return iconMap[metricId] || <BarChart3 className="h-4 w-4" />
  }

  const handleMetricClick = async (metric: MetricData) => {
    setSelectedMetric(selectedMetric === metric.id ? null : metric.id)
    
    // Announce metric selection
    const metricName = t(metric.id as any) || metric.id
    const value = formatValue(metric)
    announce(`${metricName}: ${value}`, 'polite')
    
    // Track metric interaction
    await trackEvent('coach_metric_selected', {
      userId,
      metricId: metric.id,
      value: metric.value,
      timeRange
    })
  }

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`} role="status" aria-live="polite">
        <div className="sr-only">{t('loading') || 'Loading metrics...'}</div>
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-1/3"></div>
              <div className="h-6 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-2 bg-muted rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Metrics overview header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight" id="metrics-heading">
            {t('metrics')}
          </h2>
          <p className="text-muted-foreground">
            {t('performance')} - {timeRange}
          </p>
        </div>
        
        <Button
          variant="outline"
          onClick={() => window.location.reload()}
          ariaLabel={t('refresh') || 'Refresh metrics'}
        >
          {t('refresh') || 'Refresh'}
        </Button>
      </div>

      {/* Metrics grid */}
      <div 
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
        role="region"
        aria-labelledby="metrics-heading"
      >
        {metrics.map((metric) => {
          const change = calculateChange(metric)
          const progress = calculateProgress(metric)
          const isSelected = selectedMetric === metric.id
          
          return (
            <Card 
              key={metric.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                isSelected ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => handleMetricClick(metric)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleMetricClick(metric)
                }
              }}
              tabIndex={0}
              role="button"
              aria-pressed={isSelected}
              aria-describedby={`${metric.id}-description`}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t(metric.id as any) || metric.id}
                </CardTitle>
                <div className="text-muted-foreground" aria-hidden="true">
                  {getMetricIcon(metric.id)}
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-2">
                  {/* Main value */}
                  <div className="text-2xl font-bold">
                    {formatValue(metric)}
                  </div>
                  
                  {/* Change indicator */}
                  <div className="flex items-center text-xs text-muted-foreground">
                    {change !== 0 && (
                      <>
                        {metric.trend === 'up' ? (
                          <TrendingUp className="mr-1 h-3 w-3 text-green-500" aria-hidden="true" />
                        ) : metric.trend === 'down' ? (
                          <TrendingDown className="mr-1 h-3 w-3 text-red-500" aria-hidden="true" />
                        ) : null}
                        <span className={
                          metric.trend === 'up' ? 'text-green-500' : 
                          metric.trend === 'down' ? 'text-red-500' : ''
                        }>
                          {change > 0 ? '+' : ''}{change.toFixed(1)}%
                        </span>
                        <span className="ml-1">from last period</span>
                      </>
                    )}
                  </div>
                  
                  {/* Progress bar for metrics with targets */}
                  {metric.target && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Progress to target</span>
                        <span>{progress.toFixed(0)}%</span>
                      </div>
                      <Progress 
                        value={progress} 
                        className="h-2"
                        aria-label={`Progress towards ${t(metric.id as any)} target: ${progress.toFixed(0)}%`}
                      />
                      <div className="text-xs text-muted-foreground">
                        Target: {formatValue({ ...metric, value: metric.target })}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Screen reader description */}
                <div id={`${metric.id}-description`} className="sr-only">
                  {t(metric.id as any)} is {formatValue(metric)}.
                  {change !== 0 && (
                    <>
                      {' '}This is {change > 0 ? 'an increase' : 'a decrease'} of {Math.abs(change).toFixed(1)}% from the previous period.
                    </>
                  )}
                  {metric.target && (
                    <>
                      {' '}Progress towards target of {formatValue({ ...metric, value: metric.target })} is {progress.toFixed(0)}%.
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Detailed view for selected metric */}
      {selectedMetric && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>
              {t(selectedMetric as any)} - {t('details')}
            </CardTitle>
            <CardDescription>
              Detailed analysis and recommendations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Detailed insights and recommendations for {t(selectedMetric as any)} would appear here.
                This could include trend analysis, benchmarking, and actionable suggestions.
              </p>
              
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  {t('viewReport') || 'View Report'}
                </Button>
                <Button size="sm" variant="outline">
                  {t('exportData') || 'Export Data'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
