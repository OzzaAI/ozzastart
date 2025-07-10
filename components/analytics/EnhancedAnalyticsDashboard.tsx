'use client'

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { motion } from 'framer-motion'
import { 
  BarChart3, 
  Brain, 
  TrendingUp, 
  Users, 
  Target, 
  Eye,
  DollarSign,
  Clock,
  Activity,
  BookOpen,
  Zap,
  Settings
} from 'lucide-react'
import NarrativeAnalytics from './NarrativeAnalytics'
import TrafficChart from './TrafficChart'
import MetricCard from './MetricCard'

interface EnhancedAnalyticsDashboardProps {
  hasAnalytics: boolean
  userRole: string
  businessGoals?: string[]
}

// Mock data generator for demonstration
const generateMockAnalyticsData = (timeRange: '7d' | '30d' | '90d') => {
  const baseMetrics = {
    pageViews: {
      value: Math.floor(Math.random() * 10000) + 5000,
      previousValue: Math.floor(Math.random() * 8000) + 4000,
      trend: Math.random() > 0.5 ? 'up' : 'down',
      trendPercentage: Math.floor(Math.random() * 30) + 5,
      periodLabel: 'vs last period',
      confidence: Math.floor(Math.random() * 20) + 80
    },
    uniqueVisitors: {
      value: Math.floor(Math.random() * 3000) + 1500,
      previousValue: Math.floor(Math.random() * 2500) + 1200,
      trend: Math.random() > 0.4 ? 'up' : 'down',
      trendPercentage: Math.floor(Math.random() * 25) + 3,
      periodLabel: 'vs last period',
      confidence: Math.floor(Math.random() * 15) + 85
    },
    conversions: {
      value: Math.floor(Math.random() * 150) + 50,
      previousValue: Math.floor(Math.random() * 120) + 40,
      trend: Math.random() > 0.6 ? 'up' : 'down',
      trendPercentage: Math.floor(Math.random() * 40) + 10,
      periodLabel: 'vs last period',
      confidence: Math.floor(Math.random() * 10) + 90
    },
    conversionRate: {
      value: Number((Math.random() * 5 + 1).toFixed(2)),
      previousValue: Number((Math.random() * 4 + 0.8).toFixed(2)),
      trend: Math.random() > 0.5 ? 'up' : 'down',
      trendPercentage: Math.floor(Math.random() * 20) + 5,
      periodLabel: 'vs last period',
      confidence: Math.floor(Math.random() * 15) + 85
    },
    revenue: {
      value: Math.floor(Math.random() * 50000) + 25000,
      previousValue: Math.floor(Math.random() * 40000) + 20000,
      trend: Math.random() > 0.4 ? 'up' : 'down',
      trendPercentage: Math.floor(Math.random() * 35) + 8,
      periodLabel: 'vs last period',
      confidence: Math.floor(Math.random() * 10) + 90
    },
    engagementTime: {
      value: Math.floor(Math.random() * 300) + 120,
      previousValue: Math.floor(Math.random() * 250) + 100,
      trend: Math.random() > 0.5 ? 'up' : 'down',
      trendPercentage: Math.floor(Math.random() * 15) + 5,
      periodLabel: 'vs last period',
      confidence: Math.floor(Math.random() * 20) + 80
    },
    bounceRate: {
      value: Number((Math.random() * 30 + 25).toFixed(1)),
      previousValue: Number((Math.random() * 35 + 30).toFixed(1)),
      trend: Math.random() > 0.6 ? 'down' : 'up', // Lower bounce rate is better
      trendPercentage: Math.floor(Math.random() * 20) + 3,
      periodLabel: 'vs last period',
      confidence: Math.floor(Math.random() * 15) + 85
    },
    userSatisfaction: {
      value: Number((Math.random() * 2 + 8).toFixed(1)),
      previousValue: Number((Math.random() * 1.5 + 7.5).toFixed(1)),
      trend: Math.random() > 0.3 ? 'up' : 'down',
      trendPercentage: Math.floor(Math.random() * 10) + 2,
      periodLabel: 'vs last period',
      confidence: Math.floor(Math.random() * 25) + 75
    }
  }
  
  // Adjust trends to be more realistic
  Object.values(baseMetrics).forEach(metric => {
    if (metric.trend === 'up') {
      metric.value = Math.max(metric.value, metric.previousValue * 1.05)
    } else if (metric.trend === 'down') {
      metric.value = Math.min(metric.value, metric.previousValue * 0.95)
    }
  })
  
  return baseMetrics
}

export default function EnhancedAnalyticsDashboard({ 
  hasAnalytics, 
  userRole,
  businessGoals = ['increase_revenue', 'improve_conversion', 'grow_audience']
}: EnhancedAnalyticsDashboardProps) {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')
  const [activeView, setActiveView] = useState<'story' | 'traditional' | 'insights'>('story')
  
  const analyticsData = useMemo(() => ({
    metrics: generateMockAnalyticsData(timeRange),
    timeRange,
    userRole,
    businessGoals
  }), [timeRange, userRole, businessGoals])
  
  const rangeOptions = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' }
  ]
  
  const handleInsightAction = (insightId: string, action: string) => {
    console.log(`Taking action: ${action} for insight: ${insightId}`)
    // Here you would implement the actual action logic
  }
  
  if (!hasAnalytics) {
    return (
      <div className=\"bg-white rounded-lg shadow p-6 sm:p-8 text-center\">
        <div className=\"mx-auto w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mb-4\">
          <Brain className=\"h-8 w-8 text-indigo-600\" />
        </div>
        <h3 className=\"text-lg font-medium text-gray-900 mb-2\">
          Narrative Analytics Dashboard
        </h3>
        <p className=\"text-gray-600 mb-6\">
          Transform your data into actionable stories with AI-powered insights and recommendations.
        </p>
        <div className=\"bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 mb-6 border border-indigo-200\">
          <h4 className=\"font-medium text-indigo-900 mb-3\">Included with Pro:</h4>\n          <ul className=\"text-sm text-indigo-700 space-y-2\">
            <li className=\"flex items-center gap-2\">
              <BookOpen className=\"w-4 h-4\" />
              AI-powered data storytelling
            </li>
            <li className=\"flex items-center gap-2\">
              <Brain className=\"w-4 h-4\" />
              Intelligent insight generation
            </li>
            <li className=\"flex items-center gap-2\">
              <Target className=\"w-4 h-4\" />
              Actionable optimization recommendations
            </li>
            <li className=\"flex items-center gap-2\">
              <Zap className=\"w-4 h-4\" />
              Real-time performance narratives
            </li>
          </ul>
        </div>
        <Button className=\"bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-md transition-all duration-200 w-full sm:w-auto\">
          Upgrade to Pro
        </Button>
      </div>
    )
  }
  
  return (
    <div className=\"space-y-6\">
      {/* Enhanced Header */}
      <div className=\"flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0\">
        <div className=\"flex items-center gap-3\">
          <div className=\"p-2 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg\">
            <Brain className=\"h-6 w-6 text-indigo-600\" />
          </div>
          <div>
            <h2 className=\"text-xl sm:text-2xl font-bold text-gray-900\">Analytics Intelligence</h2>
            <p className=\"text-sm text-gray-600\">AI-powered insights and data storytelling</p>
          </div>
        </div>
        
        <div className=\"flex items-center gap-3\">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as '7d' | '30d' | '90d')}
            className=\"border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500\"
          >
            {rangeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          
          <Button
            variant=\"outline\"
            size=\"sm\"
            className=\"gap-2\"
          >
            <Settings className=\"w-4 h-4\" />
            Configure
          </Button>
        </div>
      </div>
      
      {/* View Toggle */}
      <Tabs value={activeView} onValueChange={(value) => setActiveView(value as any)} className=\"w-full\">
        <TabsList className=\"grid w-full grid-cols-3\">
          <TabsTrigger value=\"story\" className=\"gap-2\">
            <BookOpen className=\"w-4 h-4\" />
            Story View
          </TabsTrigger>
          <TabsTrigger value=\"insights\" className=\"gap-2\">
            <Brain className=\"w-4 h-4\" />
            Smart Insights
          </TabsTrigger>
          <TabsTrigger value=\"traditional\" className=\"gap-2\">
            <BarChart3 className=\"w-4 h-4\" />
            Traditional
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value=\"story\" className=\"space-y-6 mt-6\">
          <NarrativeAnalytics 
            data={analyticsData}
            onInsightAction={handleInsightAction}
          />
        </TabsContent>
        
        <TabsContent value=\"insights\" className=\"space-y-6 mt-6\">
          {/* Quick Insights Overview */}
          <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4\">
            <Card className=\"border-l-4 border-l-emerald-500\">
              <CardContent className=\"p-4\">
                <div className=\"flex items-center gap-2 mb-2\">
                  <TrendingUp className=\"w-4 h-4 text-emerald-500\" />
                  <span className=\"text-sm font-medium text-gray-600\">Revenue Growth</span>
                </div>
                <div className=\"text-2xl font-bold text-emerald-600\">
                  +{analyticsData.metrics.revenue.trendPercentage}%
                </div>
                <div className=\"text-xs text-gray-500\">
                  ${analyticsData.metrics.revenue.value.toLocaleString()} total
                </div>
              </CardContent>
            </Card>
            
            <Card className=\"border-l-4 border-l-blue-500\">
              <CardContent className=\"p-4\">
                <div className=\"flex items-center gap-2 mb-2\">
                  <Users className=\"w-4 h-4 text-blue-500\" />
                  <span className=\"text-sm font-medium text-gray-600\">Audience Growth</span>
                </div>
                <div className=\"text-2xl font-bold text-blue-600\">
                  +{analyticsData.metrics.uniqueVisitors.trendPercentage}%
                </div>
                <div className=\"text-xs text-gray-500\">
                  {analyticsData.metrics.uniqueVisitors.value.toLocaleString()} visitors
                </div>
              </CardContent>
            </Card>
            
            <Card className=\"border-l-4 border-l-purple-500\">
              <CardContent className=\"p-4\">
                <div className=\"flex items-center gap-2 mb-2\">
                  <Target className=\"w-4 h-4 text-purple-500\" />
                  <span className=\"text-sm font-medium text-gray-600\">Conversion Rate</span>
                </div>
                <div className=\"text-2xl font-bold text-purple-600\">
                  {analyticsData.metrics.conversionRate.value}%
                </div>
                <div className=\"text-xs text-gray-500\">
                  {analyticsData.metrics.conversions.value} conversions
                </div>
              </CardContent>
            </Card>
            
            <Card className=\"border-l-4 border-l-amber-500\">
              <CardContent className=\"p-4\">
                <div className=\"flex items-center gap-2 mb-2\">
                  <Clock className=\"w-4 h-4 text-amber-500\" />
                  <span className=\"text-sm font-medium text-gray-600\">Engagement</span>
                </div>
                <div className=\"text-2xl font-bold text-amber-600\">
                  {Math.floor(analyticsData.metrics.engagementTime.value / 60)}m
                </div>
                <div className=\"text-xs text-gray-500\">
                  avg. session time
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* AI-Generated Insights */}
          <Card>
            <CardHeader>
              <CardTitle className=\"flex items-center gap-2\">
                <Brain className=\"w-5 h-5 text-indigo-600\" />
                AI-Generated Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className=\"space-y-4\">
                <div className=\"p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg border border-emerald-200\">
                  <div className=\"flex items-start gap-3\">
                    <div className=\"p-1 bg-emerald-100 rounded-full\">
                      <TrendingUp className=\"w-4 h-4 text-emerald-600\" />
                    </div>
                    <div>
                      <h4 className=\"font-semibold text-emerald-900 mb-1\">Revenue Momentum Building</h4>
                      <p className=\"text-sm text-emerald-700 mb-2\">
                        Your revenue has increased {analyticsData.metrics.revenue.trendPercentage}% with improving conversion rates. 
                        This suggests strong product-market fit and effective marketing strategies.
                      </p>
                      <Button size=\"sm\" variant=\"outline\" className=\"text-emerald-700 border-emerald-300\">
                        Optimize High-Performing Channels
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className=\"p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200\">
                  <div className=\"flex items-start gap-3\">
                    <div className=\"p-1 bg-blue-100 rounded-full\">
                      <Users className=\"w-4 h-4 text-blue-600\" />
                    </div>
                    <div>
                      <h4 className=\"font-semibold text-blue-900 mb-1\">Audience Quality Improving</h4>
                      <p className=\"text-sm text-blue-700 mb-2\">
                        Visitors are spending {Math.floor(analyticsData.metrics.engagementTime.value / 60)} minutes 
                        on average with only {analyticsData.metrics.bounceRate.value}% bounce rate. Consider expanding content offerings.
                      </p>
                      <Button size=\"sm\" variant=\"outline\" className=\"text-blue-700 border-blue-300\">
                        Create More Engaging Content
                      </Button>
                    </div>
                  </div>
                </div>
                
                {analyticsData.metrics.conversionRate.value < 3 && (
                  <div className=\"p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200\">
                    <div className=\"flex items-start gap-3\">
                      <div className=\"p-1 bg-amber-100 rounded-full\">
                        <Target className=\"w-4 h-4 text-amber-600\" />
                      </div>
                      <div>
                        <h4 className=\"font-semibold text-amber-900 mb-1\">Conversion Optimization Opportunity</h4>
                        <p className=\"text-sm text-amber-700 mb-2\">
                          Your {analyticsData.metrics.conversionRate.value}% conversion rate suggests significant upside potential. 
                          With your current traffic quality, small improvements could yield major results.
                        </p>
                        <Button size=\"sm\" variant=\"outline\" className=\"text-amber-700 border-amber-300\">
                          Analyze Conversion Funnel
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value=\"traditional\" className=\"space-y-6 mt-6\">
          {/* Traditional Metric Cards */}
          <div className=\"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6\">
            <MetricCard
              title=\"Page Views\"
              value={analyticsData.metrics.pageViews.value}
              change={analyticsData.metrics.pageViews.trendPercentage}
              changeLabel={analyticsData.metrics.pageViews.periodLabel}
              icon={<Eye className=\"h-5 w-5\" />}
            />
            <MetricCard
              title=\"Unique Visitors\"
              value={analyticsData.metrics.uniqueVisitors.value}
              change={analyticsData.metrics.uniqueVisitors.trendPercentage}
              changeLabel={analyticsData.metrics.uniqueVisitors.periodLabel}
              icon={<Users className=\"h-5 w-5\" />}
            />
            <MetricCard
              title=\"Conversions\"
              value={analyticsData.metrics.conversions.value}
              change={analyticsData.metrics.conversions.trendPercentage}
              changeLabel={analyticsData.metrics.conversions.periodLabel}
              icon={<Target className=\"h-5 w-5\" />}
            />
            <MetricCard
              title=\"Conversion Rate\"
              value={analyticsData.metrics.conversionRate.value}
              change={analyticsData.metrics.conversionRate.trendPercentage}
              changeLabel={analyticsData.metrics.conversionRate.periodLabel}
              format=\"percentage\"
              icon={<TrendingUp className=\"h-5 w-5\" />}
            />
          </div>
          
          {/* Traditional Traffic Chart */}
          <TrafficChart 
            data={[]} // Would be populated with actual chart data
            isLoading={false}
            range={timeRange}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}