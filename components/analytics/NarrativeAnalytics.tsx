'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  TrendingUp, 
  TrendingDown,
  Users, 
  Eye, 
  Target, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Brain,
  Heart,
  Clock,
  DollarSign,
  Activity,
  BarChart3,
  LineChart,
  PieChart
} from 'lucide-react'

// Enhanced Analytics Types for Storytelling
interface MetricData {
  value: number
  previousValue?: number
  trend: 'up' | 'down' | 'stable'
  trendPercentage: number
  periodLabel: string
  confidence: number // 0-100, how reliable the data is
}

interface AnalyticsInsight {
  id: string
  type: 'opportunity' | 'warning' | 'achievement' | 'trend' | 'anomaly'
  title: string
  narrative: string
  impact: 'low' | 'medium' | 'high'
  confidence: number
  metrics: string[] // which metrics this insight relates to
  action?: {
    label: string
    description: string
    onClick: () => void
  }
  emotionalTone: 'positive' | 'neutral' | 'negative' | 'urgent'
  timeframe: string
}

interface StoryChapter {
  title: string
  theme: 'performance' | 'growth' | 'engagement' | 'conversion' | 'retention'
  narrative: string
  metrics: MetricData[]
  insights: AnalyticsInsight[]
  visualType: 'chart' | 'comparison' | 'trend' | 'heatmap'
  emotionalArc: 'rising' | 'falling' | 'stable' | 'volatile'
}

interface NarrativeAnalyticsProps {
  data: {
    metrics: {
      pageViews: MetricData
      uniqueVisitors: MetricData
      conversions: MetricData
      conversionRate: MetricData
      revenue: MetricData
      engagementTime: MetricData
      bounceRate: MetricData
      userSatisfaction: MetricData
    }
    timeRange: '7d' | '30d' | '90d'
    userRole: string
    businessGoals: string[]
  }
  onInsightAction?: (insightId: string, action: string) => void
}

// Intelligent Insight Generation Engine
class InsightEngine {
  static generateInsights(metrics: any, userRole: string, timeRange: string): AnalyticsInsight[] {
    const insights: AnalyticsInsight[] = []
    
    // Revenue Performance Analysis
    if (metrics.revenue && metrics.conversions) {
      const revenuePerConversion = metrics.revenue.value / metrics.conversions.value
      const avgRevenuePerConversion = 250 // Industry benchmark
      
      if (revenuePerConversion > avgRevenuePerConversion * 1.2) {
        insights.push({
          id: 'high-value-conversions',
          type: 'achievement',
          title: 'High-Value Conversion Success',
          narrative: `Your conversions are generating ${Math.round(revenuePerConversion)}% more revenue than average. This suggests excellent customer targeting and value proposition alignment.`,
          impact: 'high',
          confidence: 85,
          metrics: ['revenue', 'conversions'],
          action: {
            label: 'Amplify Successful Channels',
            description: 'Double down on the marketing channels driving these high-value conversions',
            onClick: () => console.log('Amplify channels')
          },
          emotionalTone: 'positive',
          timeframe: `Last ${timeRange}`
        })
      }
    }
    
    // Engagement Quality Analysis
    if (metrics.engagementTime && metrics.bounceRate) {
      const highEngagement = metrics.engagementTime.value > 180 // 3 minutes
      const lowBounce = metrics.bounceRate.value < 40
      
      if (highEngagement && lowBounce) {
        insights.push({
          id: 'quality-engagement',
          type: 'opportunity',
          title: 'Quality Audience Engagement',
          narrative: `Visitors are staying ${Math.round(metrics.engagementTime.value / 60)} minutes on average with only ${metrics.bounceRate.value}% bouncing immediately. This indicates strong content-audience fit.`,
          impact: 'medium',
          confidence: 90,
          metrics: ['engagementTime', 'bounceRate'],
          action: {
            label: 'Optimize Conversion Path',
            description: 'Capitalize on this engagement by improving your call-to-action placement',
            onClick: () => console.log('Optimize conversion')
          },
          emotionalTone: 'positive',
          timeframe: `Last ${timeRange}`
        })
      }
    }
    
    // Traffic Growth Analysis
    if (metrics.pageViews && metrics.uniqueVisitors) {
      const viewsPerVisitor = metrics.pageViews.value / metrics.uniqueVisitors.value
      
      if (viewsPerVisitor > 3.5) {
        insights.push({
          id: 'deep-exploration',
          type: 'trend',
          title: 'Deep Content Exploration',
          narrative: `Visitors are viewing ${viewsPerVisitor.toFixed(1)} pages per session, indicating strong interest in your content ecosystem. This suggests excellent internal linking and content relevance.`,
          impact: 'medium',
          confidence: 88,
          metrics: ['pageViews', 'uniqueVisitors'],
          emotionalTone: 'positive',
          timeframe: `Last ${timeRange}`
        })
      }
    }
    
    // Conversion Rate Warning
    if (metrics.conversionRate && metrics.conversionRate.value < 2) {
      insights.push({
        id: 'conversion-optimization',
        type: 'warning',
        title: 'Conversion Rate Below Potential',
        narrative: `Your ${metrics.conversionRate.value}% conversion rate suggests room for improvement. With your current traffic quality, optimizing key conversion elements could significantly impact revenue.`,
        impact: 'high',
        confidence: 85,
        metrics: ['conversionRate'],
        action: {
          label: 'Review Conversion Funnel',
          description: 'Analyze and optimize your conversion path for better results',
          onClick: () => console.log('Review funnel')
        },
        emotionalTone: 'urgent',
        timeframe: `Last ${timeRange}`
      })
    }
    
    // Trend-based Insights
    if (metrics.uniqueVisitors && metrics.uniqueVisitors.trend === 'up' && metrics.uniqueVisitors.trendPercentage > 20) {
      insights.push({
        id: 'traffic-momentum',
        type: 'opportunity',
        title: 'Strong Traffic Growth Momentum',
        narrative: `Unique visitors have grown ${metrics.uniqueVisitors.trendPercentage}% in the ${timeRange}. This momentum creates an opportunity to scale successful acquisition channels.`,
        impact: 'high',
        confidence: 92,
        metrics: ['uniqueVisitors'],
        action: {
          label: 'Scale Successful Channels',
          description: 'Increase investment in channels driving this growth',
          onClick: () => console.log('Scale channels')
        },
        emotionalTone: 'positive',
        timeframe: `Last ${timeRange}`
      })
    }
    
    return insights
  }
  
  static generateStoryChapters(metrics: any, insights: AnalyticsInsight[]): StoryChapter[] {
    const chapters: StoryChapter[] = []
    
    // Chapter 1: Performance Overview
    chapters.push({
      title: 'Your Performance Story',
      theme: 'performance',
      narrative: this.generatePerformanceNarrative(metrics),
      metrics: [metrics.pageViews, metrics.uniqueVisitors, metrics.revenue],
      insights: insights.filter(i => i.type === 'achievement'),
      visualType: 'chart',
      emotionalArc: this.determineEmotionalArc(metrics)
    })
    
    // Chapter 2: Growth Opportunities  
    chapters.push({
      title: 'Growth Opportunities',
      theme: 'growth',
      narrative: this.generateGrowthNarrative(metrics, insights),
      metrics: [metrics.conversionRate, metrics.engagementTime],
      insights: insights.filter(i => i.type === 'opportunity'),
      visualType: 'trend',
      emotionalArc: 'rising'
    })
    
    // Chapter 3: Areas for Attention
    const warnings = insights.filter(i => i.type === 'warning')
    if (warnings.length > 0) {
      chapters.push({
        title: 'Areas Needing Attention',
        theme: 'conversion',
        narrative: this.generateWarningNarrative(warnings),
        metrics: [metrics.bounceRate, metrics.conversionRate],
        insights: warnings,
        visualType: 'comparison',
        emotionalArc: 'stable'
      })
    }
    
    return chapters
  }
  
  private static generatePerformanceNarrative(metrics: any): string {
    const totalValue = metrics.revenue?.value || 0
    const trend = metrics.revenue?.trend || 'stable'
    const visitors = metrics.uniqueVisitors?.value || 0
    
    if (trend === 'up') {
      return `Your business is showing strong momentum with $${totalValue.toLocaleString()} in revenue and ${visitors.toLocaleString()} unique visitors. The upward trajectory indicates that your current strategies are resonating with your audience.`
    } else if (trend === 'down') {
      return `While revenue is at $${totalValue.toLocaleString()} with ${visitors.toLocaleString()} visitors, recent trends suggest an opportunity to optimize your approach and recapture growth momentum.`
    } else {
      return `Your business maintains steady performance with $${totalValue.toLocaleString()} in revenue from ${visitors.toLocaleString()} unique visitors, providing a stable foundation for strategic improvements.`
    }
  }
  
  private static generateGrowthNarrative(metrics: any, insights: AnalyticsInsight[]): string {
    const opportunities = insights.filter(i => i.type === 'opportunity')
    if (opportunities.length === 0) {
      return \"Based on your current performance patterns, there are several strategic opportunities to accelerate growth and improve key metrics.\"
    }
    
    const highImpactOpportunities = opportunities.filter(o => o.impact === 'high')
    if (highImpactOpportunities.length > 0) {
      return `${highImpactOpportunities.length} high-impact growth opportunities have been identified in your data. These represent the fastest path to meaningful improvement in your key performance indicators.`
    }
    
    return `Your analytics reveal ${opportunities.length} growth opportunities that could significantly enhance your business performance through strategic optimization.`
  }
  
  private static generateWarningNarrative(warnings: AnalyticsInsight[]): string {
    const urgentWarnings = warnings.filter(w => w.emotionalTone === 'urgent')
    if (urgentWarnings.length > 0) {
      return `${urgentWarnings.length} critical areas require immediate attention to prevent potential revenue impact and maintain competitive positioning.`
    }
    
    return `While your overall performance is solid, addressing these ${warnings.length} areas will help optimize your results and prevent potential issues.`
  }
  
  private static determineEmotionalArc(metrics: any): StoryChapter['emotionalArc'] {
    const trends = Object.values(metrics).map((m: any) => m.trend)
    const upTrends = trends.filter(t => t === 'up').length
    const downTrends = trends.filter(t => t === 'down').length
    
    if (upTrends > downTrends * 2) return 'rising'
    if (downTrends > upTrends * 2) return 'falling'
    if (upTrends === downTrends) return 'volatile'
    return 'stable'
  }
}

// Main Narrative Analytics Component
export const NarrativeAnalytics: React.FC<NarrativeAnalyticsProps> = ({
  data,
  onInsightAction
}) => {
  const [activeChapter, setActiveChapter] = useState(0)
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null)
  
  const insights = useMemo(() => 
    InsightEngine.generateInsights(data.metrics, data.userRole, data.timeRange),
    [data.metrics, data.userRole, data.timeRange]
  )
  
  const storyChapters = useMemo(() => 
    InsightEngine.generateStoryChapters(data.metrics, insights),
    [data.metrics, insights]
  )
  
  const getEmotionalColor = (tone: AnalyticsInsight['emotionalTone']) => {
    switch (tone) {
      case 'positive': return 'from-emerald-50 to-green-50 border-emerald-200'
      case 'urgent': return 'from-red-50 to-orange-50 border-red-200'
      case 'negative': return 'from-gray-50 to-slate-50 border-gray-200'
      default: return 'from-blue-50 to-indigo-50 border-blue-200'
    }
  }
  
  const getImpactIcon = (impact: AnalyticsInsight['impact']) => {
    switch (impact) {
      case 'high': return <Zap className=\"w-4 h-4 text-orange-500\" />
      case 'medium': return <TrendingUp className=\"w-4 h-4 text-blue-500\" />
      default: return <Lightbulb className=\"w-4 h-4 text-gray-500\" />
    }
  }
  
  const getTypeIcon = (type: AnalyticsInsight['type']) => {
    switch (type) {
      case 'achievement': return <CheckCircle className=\"w-5 h-5 text-emerald-500\" />
      case 'opportunity': return <Target className=\"w-5 h-5 text-blue-500\" />
      case 'warning': return <AlertTriangle className=\"w-5 h-5 text-amber-500\" />
      case 'trend': return <TrendingUp className=\"w-5 h-5 text-purple-500\" />
      default: return <Brain className=\"w-5 h-5 text-gray-500\" />
    }
  }
  
  return (
    <div className=\"space-y-6\">
      {/* Story Navigation */}\n      <div className=\"flex items-center gap-3 mb-6\">\n        <Brain className=\"w-6 h-6 text-indigo-600\" />\n        <h2 className=\"text-2xl font-bold text-slate-900\">Your Analytics Story</h2>\n        <Badge variant=\"outline\" className=\"text-xs\">\n          {insights.length} insights discovered\n        </Badge>\n      </div>\n      \n      {/* Chapter Navigation */}\n      <div className=\"flex gap-2 mb-6 overflow-x-auto pb-2\">\n        {storyChapters.map((chapter, index) => (\n          <Button\n            key={index}\n            variant={activeChapter === index ? 'default' : 'outline'}\n            size=\"sm\"\n            onClick={() => setActiveChapter(index)}\n            className=\"whitespace-nowrap\"\n          >\n            {chapter.title}\n          </Button>\n        ))}\n      </div>\n      \n      {/* Active Chapter Content */}\n      <AnimatePresence mode=\"wait\">\n        <motion.div\n          key={activeChapter}\n          initial={{ opacity: 0, y: 20 }}\n          animate={{ opacity: 1, y: 0 }}\n          exit={{ opacity: 0, y: -20 }}\n          transition={{ duration: 0.3 }}\n          className=\"space-y-6\"\n        >\n          {storyChapters[activeChapter] && (\n            <>\n              {/* Chapter Header */}\n              <Card className=\"border-l-4 border-l-indigo-500\">\n                <CardHeader>\n                  <div className=\"flex items-center gap-3\">\n                    <div className={`p-2 rounded-lg ${\n                      storyChapters[activeChapter].emotionalArc === 'rising' ? 'bg-emerald-100' :\n                      storyChapters[activeChapter].emotionalArc === 'falling' ? 'bg-red-100' :\n                      storyChapters[activeChapter].emotionalArc === 'volatile' ? 'bg-amber-100' :\n                      'bg-blue-100'\n                    }`}>\n                      {storyChapters[activeChapter].theme === 'performance' && <BarChart3 className=\"w-5 h-5 text-indigo-600\" />}\n                      {storyChapters[activeChapter].theme === 'growth' && <TrendingUp className=\"w-5 h-5 text-emerald-600\" />}\n                      {storyChapters[activeChapter].theme === 'conversion' && <Target className=\"w-5 h-5 text-amber-600\" />}\n                    </div>\n                    <div>\n                      <CardTitle className=\"text-xl\">{storyChapters[activeChapter].title}</CardTitle>\n                      <p className=\"text-sm text-slate-600 mt-1\">\n                        Based on {data.timeRange} of data • {storyChapters[activeChapter].insights.length} insights\n                      </p>\n                    </div>\n                  </div>\n                </CardHeader>\n                <CardContent>\n                  <p className=\"text-slate-700 leading-relaxed\">\n                    {storyChapters[activeChapter].narrative}\n                  </p>\n                </CardContent>\n              </Card>\n              \n              {/* Key Metrics Summary */}\n              <div className=\"grid grid-cols-1 md:grid-cols-3 gap-4\">\n                {storyChapters[activeChapter].metrics.map((metric, index) => (\n                  <Card key={index} className=\"\">\n                    <CardContent className=\"p-4\">\n                      <div className=\"flex items-center justify-between mb-2\">\n                        <span className=\"text-sm font-medium text-slate-600\">\n                          {Object.keys(data.metrics)[Object.values(data.metrics).indexOf(metric)]}\n                        </span>\n                        {metric.trend === 'up' ? (\n                          <ArrowUpRight className=\"w-4 h-4 text-emerald-500\" />\n                        ) : metric.trend === 'down' ? (\n                          <ArrowDownRight className=\"w-4 h-4 text-red-500\" />\n                        ) : (\n                          <Activity className=\"w-4 h-4 text-gray-400\" />\n                        )}\n                      </div>\n                      <div className=\"text-2xl font-bold text-slate-900 mb-1\">\n                        {typeof metric.value === 'number' ? metric.value.toLocaleString() : metric.value}\n                      </div>\n                      {metric.trendPercentage !== 0 && (\n                        <div className={`text-sm flex items-center gap-1 ${\n                          metric.trend === 'up' ? 'text-emerald-600' : \n                          metric.trend === 'down' ? 'text-red-600' : 'text-gray-500'\n                        }`}>\n                          {metric.trend === 'up' ? '+' : metric.trend === 'down' ? '-' : ''}\n                          {Math.abs(metric.trendPercentage)}% {metric.periodLabel}\n                        </div>\n                      )}\n                    </CardContent>\n                  </Card>\n                ))}\n              </div>\n              \n              {/* Chapter Insights */}\n              <div className=\"space-y-4\">\n                {storyChapters[activeChapter].insights.map((insight) => (\n                  <motion.div\n                    key={insight.id}\n                    layout\n                    className={`relative p-4 rounded-xl border bg-gradient-to-r ${getEmotionalColor(insight.emotionalTone)} transition-all duration-200 hover:shadow-md`}\n                  >\n                    <div className=\"flex items-start gap-3\">\n                      <div className=\"flex-shrink-0 mt-1\">\n                        {getTypeIcon(insight.type)}\n                      </div>\n                      <div className=\"flex-1 min-w-0\">\n                        <div className=\"flex items-start justify-between mb-2\">\n                          <div className=\"flex items-center gap-2\">\n                            <h4 className=\"font-semibold text-slate-900\">{insight.title}</h4>\n                            {getImpactIcon(insight.impact)}\n                          </div>\n                          <div className=\"flex items-center gap-2\">\n                            <Badge variant=\"outline\" className=\"text-xs\">\n                              {insight.confidence}% confidence\n                            </Badge>\n                            <Button\n                              variant=\"ghost\"\n                              size=\"sm\"\n                              onClick={() => setExpandedInsight(\n                                expandedInsight === insight.id ? null : insight.id\n                              )}\n                            >\n                              {expandedInsight === insight.id ? 'Less' : 'More'}\n                            </Button>\n                          </div>\n                        </div>\n                        \n                        <p className=\"text-sm text-slate-700 mb-3\">\n                          {insight.narrative}\n                        </p>\n                        \n                        <AnimatePresence>\n                          {expandedInsight === insight.id && (\n                            <motion.div\n                              initial={{ opacity: 0, height: 0 }}\n                              animate={{ opacity: 1, height: 'auto' }}\n                              exit={{ opacity: 0, height: 0 }}\n                              className=\"space-y-3 border-t border-slate-200 pt-3 mt-3\"\n                            >\n                              <div className=\"grid grid-cols-2 gap-4 text-xs\">\n                                <div>\n                                  <span className=\"font-medium text-slate-600\">Impact Level:</span>\n                                  <span className={`ml-1 capitalize ${\n                                    insight.impact === 'high' ? 'text-orange-600 font-medium' :\n                                    insight.impact === 'medium' ? 'text-blue-600' : 'text-gray-600'\n                                  }`}>\n                                    {insight.impact}\n                                  </span>\n                                </div>\n                                <div>\n                                  <span className=\"font-medium text-slate-600\">Related Metrics:</span>\n                                  <span className=\"ml-1 text-slate-500\">\n                                    {insight.metrics.join(', ')}\n                                  </span>\n                                </div>\n                              </div>\n                              \n                              {insight.action && (\n                                <div className=\"flex items-center justify-between p-3 bg-white/50 rounded-lg\">\n                                  <div>\n                                    <div className=\"font-medium text-sm text-slate-900\">\n                                      {insight.action.label}\n                                    </div>\n                                    <div className=\"text-xs text-slate-600\">\n                                      {insight.action.description}\n                                    </div>\n                                  </div>\n                                  <Button\n                                    size=\"sm\"\n                                    onClick={() => {\n                                      insight.action?.onClick()\n                                      onInsightAction?.(insight.id, insight.action.label)\n                                    }}\n                                  >\n                                    Take Action\n                                  </Button>\n                                </div>\n                              )}\n                            </motion.div>\n                          )}\n                        </AnimatePresence>\n                      </div>\n                    </div>\n                  </motion.div>\n                ))}\n              </div>\n            </>\n          )}\n        </motion.div>\n      </AnimatePresence>\n      \n      {/* Summary Actions */}\n      <Card className=\"bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200\">\n        <CardContent className=\"p-6\">\n          <div className=\"flex items-center gap-3 mb-4\">\n            <Heart className=\"w-5 h-5 text-indigo-600\" />\n            <h3 className=\"font-semibold text-slate-900\">Your Analytics Summary</h3>\n          </div>\n          <div className=\"grid grid-cols-1 md:grid-cols-3 gap-4 text-sm\">\n            <div className=\"text-center\">\n              <div className=\"text-2xl font-bold text-emerald-600\">\n                {insights.filter(i => i.type === 'achievement').length}\n              </div>\n              <div className=\"text-slate-600\">Achievements</div>\n            </div>\n            <div className=\"text-center\">\n              <div className=\"text-2xl font-bold text-blue-600\">\n                {insights.filter(i => i.type === 'opportunity').length}\n              </div>\n              <div className=\"text-slate-600\">Opportunities</div>\n            </div>\n            <div className=\"text-center\">\n              <div className=\"text-2xl font-bold text-amber-600\">\n                {insights.filter(i => i.impact === 'high').length}\n              </div>\n              <div className=\"text-slate-600\">High Impact</div>\n            </div>\n          </div>\n        </CardContent>\n      </Card>\n    </div>\n  )\n}\n\nexport default NarrativeAnalytics