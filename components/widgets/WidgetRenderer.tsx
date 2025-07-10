'use client';

import { useState } from 'react';
import { Maximize2, Minimize2, X, TrendingUp, TrendingDown, DollarSign, Target, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CombinedRevenueCard from '@/components/analytics/CombinedRevenueCard';
import { motion, AnimatePresence } from 'framer-motion';

export interface Widget {
  id: string;
  type: 'revenue' | 'marketing' | 'projects' | 'recommendations' | 'analytics' | 'community';
  title: string;
  data?: any;
  interactive?: boolean;
  actions?: WidgetAction[];
}

export interface WidgetAction {
  id: string;
  label: string;
  type: 'button' | 'input' | 'select';
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  action: (params?: any) => void;
}

interface WidgetRendererProps {
  widgets: Widget[];
  onRemoveWidget: (widgetId: string) => void;
  onExpandWidget: (widgetId: string) => void;
  expandedWidget: string | null;
}

export default function WidgetRenderer({ 
  widgets, 
  onRemoveWidget, 
  onExpandWidget, 
  expandedWidget 
}: WidgetRendererProps) {
  return (
    <div className="space-y-4">
      <AnimatePresence>
        {widgets.map((widget) => (
          <motion.div
            key={widget.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className={`
              bg-gradient-to-br from-black/40 to-gray-900/40 backdrop-blur-xl 
              border border-white/10 rounded-xl overflow-hidden
              ${expandedWidget === widget.id ? 'h-auto' : 'h-64'}
              transition-all duration-300
            `}
          >
            <WidgetContainer 
              widget={widget}
              isExpanded={expandedWidget === widget.id}
              onRemove={() => onRemoveWidget(widget.id)}
              onExpand={() => onExpandWidget(widget.id)}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function WidgetContainer({ 
  widget, 
  isExpanded, 
  onRemove, 
  onExpand 
}: {
  widget: Widget;
  isExpanded: boolean;
  onRemove: () => void;
  onExpand: () => void;
}) {
  return (
    <div className="h-full flex flex-col">
      {/* Widget Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <WidgetIcon type={widget.type} />
          <div>
            <h3 className="text-white font-medium">{widget.title}</h3>
            {widget.data?.subtitle && (
              <p className="text-gray-400 text-sm">{widget.data.subtitle}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onExpand}
            className="text-gray-400 hover:text-white"
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Widget Content */}
      <div className="flex-1 p-4 overflow-hidden">
        <WidgetContent widget={widget} isExpanded={isExpanded} />
      </div>

      {/* Widget Actions */}
      {widget.actions && widget.actions.length > 0 && (
        <div className="border-t border-white/10 p-4">
          <div className="flex gap-2 flex-wrap">
            {widget.actions.map((action) => (
              <ActionButton key={action.id} action={action} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function WidgetContent({ widget, isExpanded }: { widget: Widget; isExpanded: boolean }) {
  switch (widget.type) {
    case 'revenue':
      return <RevenueWidget data={widget.data} isExpanded={isExpanded} />;
    case 'marketing':
      return <MarketingWidget data={widget.data} isExpanded={isExpanded} />;
    case 'projects':
      return <ProjectsWidget data={widget.data} isExpanded={isExpanded} />;
    case 'recommendations':
      return <RecommendationsWidget data={widget.data} isExpanded={isExpanded} />;
    default:
      return <GenericWidget data={widget.data} isExpanded={isExpanded} />;
  }
}

function RevenueWidget({ data, isExpanded }: { data?: any; isExpanded: boolean }) {
  // Use mock data if no real data provided
  const revenueData = data || {
    current: 8420,
    previous: 6840,
    growth: 23,
    projection: 10000
  };

  return (
    <div className="h-full">
      {isExpanded ? (
        <div className="scale-90 origin-top-left">
          <CombinedRevenueCard
            monthlyEarnings={revenueData.current}
            lifetimeEarnings={revenueData.current * 3}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <MetricCard
              label="This Month"
              value={`$${revenueData.current.toLocaleString()}`}
              trend={{ value: revenueData.growth, direction: revenueData.growth > 0 ? 'up' : 'down' }}
            />
            <MetricCard
              label="Projected"
              value={`$${revenueData.projection.toLocaleString()}`}
              subtitle="On track"
            />
          </div>
          
          <div className="bg-white/5 rounded-lg p-3">
            <p className="text-gray-300 text-sm">
              Revenue up {revenueData.growth}% from last month. Strong performance across all channels.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function MarketingWidget({ data, isExpanded }: { data?: any; isExpanded: boolean }) {
  const marketingData = data || {
    adSpend: 800,
    roas: 6.2,
    conversions: 67,
    topCampaign: 'Summer Sale'
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <MetricCard
          label="ROAS"
          value={`${marketingData.roas}x`}
          trend={{ value: 15, direction: 'up' }}
        />
        <MetricCard
          label="Ad Spend"
          value={`$${marketingData.adSpend}`}
          subtitle="This month"
        />
      </div>
      
      {isExpanded && (
        <div className="space-y-3">
          <div className="bg-white/5 rounded-lg p-3">
            <h4 className="text-white font-medium mb-2">Top Campaign</h4>
            <p className="text-gray-300 text-sm">{marketingData.topCampaign} - 7.5x ROAS</p>
          </div>
          
          <div className="bg-white/5 rounded-lg p-3">
            <h4 className="text-white font-medium mb-2">Recommendations</h4>
            <p className="text-gray-300 text-sm">
              Your ROAS is excellent. Consider increasing budget by $300-500 for maximum growth.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function ProjectsWidget({ data, isExpanded }: { data?: any; isExpanded: boolean }) {
  const projectData = data || {
    active: 8,
    completed: 15,
    completionRate: 88,
    overdue: 2
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <MetricCard
          label="Completion Rate"
          value={`${projectData.completionRate}%`}
          trend={{ value: 5, direction: 'up' }}
        />
        <MetricCard
          label="Active Projects"
          value={projectData.active.toString()}
          subtitle={`${projectData.overdue} overdue`}
        />
      </div>
      
      {isExpanded && (
        <div className="space-y-3">
          <div className="bg-white/5 rounded-lg p-3">
            <h4 className="text-white font-medium mb-2">Project Health</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-300">On Track</span>
                <span className="text-green-400">{projectData.active - projectData.overdue}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-300">Overdue</span>
                <span className="text-amber-400">{projectData.overdue}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RecommendationsWidget({ data, isExpanded }: { data?: any; isExpanded: boolean }) {
  const recommendations = data?.recommendations || [
    {
      title: "Increase Ad Budget",
      description: "Your ROAS is 6.2x - consider increasing budget by $500",
      priority: "high",
      impact: "Additional $3,100 revenue expected"
    },
    {
      title: "Focus on Project Delivery",
      description: "2 projects are overdue - review resource allocation",
      priority: "medium",
      impact: "Improve client satisfaction"
    }
  ];

  return (
    <div className="space-y-3">
      {recommendations.map((rec: any, index: number) => (
        <div key={index} className="bg-white/5 rounded-lg p-3">
          <div className="flex items-start justify-between mb-2">
            <h4 className="text-white font-medium">{rec.title}</h4>
            <span className={`
              text-xs px-2 py-1 rounded-full
              ${rec.priority === 'high' ? 'bg-red-500/20 text-red-300' : 
                rec.priority === 'medium' ? 'bg-amber-500/20 text-amber-300' : 
                'bg-blue-500/20 text-blue-300'}
            `}>
              {rec.priority}
            </span>
          </div>
          <p className="text-gray-300 text-sm mb-2">{rec.description}</p>
          {rec.impact && (
            <p className="text-green-400 text-xs">{rec.impact}</p>
          )}
        </div>
      ))}
    </div>
  );
}

function GenericWidget({ data, isExpanded }: { data?: any; isExpanded: boolean }) {
  return (
    <div className="text-gray-300">
      <p>Widget content would appear here</p>
      {isExpanded && (
        <div className="mt-4 text-sm text-gray-400">
          Expanded view with more details...
        </div>
      )}
    </div>
  );
}

function MetricCard({ 
  label, 
  value, 
  trend, 
  subtitle 
}: { 
  label: string; 
  value: string; 
  trend?: { value: number; direction: 'up' | 'down' }; 
  subtitle?: string; 
}) {
  return (
    <div className="bg-white/5 rounded-lg p-3">
      <p className="text-gray-400 text-xs mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <span className="text-white font-semibold text-lg">{value}</span>
        {trend && (
          <div className={`flex items-center gap-1 text-xs ${
            trend.direction === 'up' ? 'text-green-400' : 'text-red-400'
          }`}>
            {trend.direction === 'up' ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {trend.value}%
          </div>
        )}
      </div>
      {subtitle && (
        <p className="text-gray-400 text-xs mt-1">{subtitle}</p>
      )}
    </div>
  );
}

function ActionButton({ action }: { action: WidgetAction }) {
  const getVariantStyles = (variant?: string) => {
    switch (variant) {
      case 'primary':
        return 'bg-blue-500/20 border-blue-400/30 text-blue-300 hover:bg-blue-500/30';
      case 'success':
        return 'bg-green-500/20 border-green-400/30 text-green-300 hover:bg-green-500/30';
      case 'warning':
        return 'bg-amber-500/20 border-amber-400/30 text-amber-300 hover:bg-amber-500/30';
      case 'danger':
        return 'bg-red-500/20 border-red-400/30 text-red-300 hover:bg-red-500/30';
      default:
        return 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10';
    }
  };

  return (
    <button
      onClick={() => action.action()}
      className={`
        px-3 py-2 rounded-lg border text-sm font-medium
        transition-all duration-200 hover:scale-105
        ${getVariantStyles(action.variant)}
      `}
    >
      {action.label}
    </button>
  );
}

function WidgetIcon({ type }: { type: string }) {
  const iconClass = "w-5 h-5";
  
  switch (type) {
    case 'revenue':
      return <DollarSign className={`${iconClass} text-green-400`} />;
    case 'marketing':
      return <TrendingUp className={`${iconClass} text-blue-400`} />;
    case 'projects':
      return <Target className={`${iconClass} text-purple-400`} />;
    case 'recommendations':
      return <Zap className={`${iconClass} text-amber-400`} />;
    default:
      return <div className={`${iconClass} bg-gray-400 rounded`} />;
  }
}