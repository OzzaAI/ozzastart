'use client';

import { useState } from 'react';
import { useChat } from 'ai/react';
import { Bot, Send, Loader2, Sparkles, BarChart3, DollarSign, Users, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Import existing beautiful components
import CashOutCard from '@/components/dashboard/CashOutCard';

interface DynamicWidget {
  id: string;
  type: 'revenue' | 'projects' | 'analytics' | 'team';
  title: string;
  component: React.ReactNode;
}

export default function ChatWorkspace() {
  const [activeWidgets, setActiveWidgets] = useState<DynamicWidget[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(true);

  const { messages, input, handleInputChange, handleSubmit, isLoading, error, append } = useChat({
    api: '/api/ai/chat',
    initialMessages: [
      {
        id: '1',
        role: 'assistant',
        content: `Welcome to Ozza! I'm your AI business intelligence assistant. I can help you analyze your business, manage projects, and provide insights. What would you like to work on today?`
      }
    ],
    onFinish: (message) => {
      // Parse AI response for widget triggers
      parseResponseForWidgets(message.content);
    }
  });

  const parseResponseForWidgets = (content: string) => {
    const widgets: DynamicWidget[] = [];
    
    // Check if AI mentions revenue/financial data
    if (content.toLowerCase().includes('revenue') || content.toLowerCase().includes('financial') || content.toLowerCase().includes('income')) {
      widgets.push({
        id: 'revenue-1',
        type: 'revenue',
        title: 'Revenue Overview',
        component: <CashOutCard availableBalance={1250} pendingBalance={340} lifetimeEarnings={15600} />
      });
    }

    // Add more widget parsing logic here
    if (widgets.length > 0) {
      setActiveWidgets(prev => [...prev, ...widgets]);
      setIsFullscreen(false);
    }
  };

  const suggestions = [
    { icon: BarChart3, text: "Show me my business performance", color: "from-blue-500 to-purple-600" },
    { icon: DollarSign, text: "Analyze my revenue trends", color: "from-green-500 to-emerald-600" },
    { icon: Users, text: "How is my team performing?", color: "from-orange-500 to-red-600" },
    { icon: Calendar, text: "What projects need attention?", color: "from-purple-500 to-pink-600" }
  ];

  const handleSuggestionClick = (suggestion: string) => {
    append({ role: 'user', content: suggestion });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
      
      <div className="relative z-10 min-h-screen flex">
        {/* Main Chat Area */}
        <motion.div 
          className={`transition-all duration-500 ${isFullscreen ? 'w-full' : 'w-1/2'} flex flex-col`}
          layout
        >
          {/* Header */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Ozza Workspace</h1>
                <p className="text-gray-400 text-sm">Your AI-powered business intelligence center</p>
              </div>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="max-w-4xl mx-auto space-y-6">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-3xl ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
                    {message.role === 'assistant' && (
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                          <Bot className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-sm text-gray-400">Ozza AI</span>
                      </div>
                    )}
                    <div className={`
                      p-4 rounded-2xl backdrop-blur-xl border
                      ${message.role === 'user' 
                        ? 'bg-blue-500/20 border-blue-400/30 text-white ml-12' 
                        : 'bg-white/5 border-white/10 text-gray-100'
                      }
                    `}>
                      <div className="prose prose-invert max-w-none">
                        {message.content}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                      <Bot className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-sm text-gray-400">Ozza AI</span>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-xl">
                    <div className="flex items-center gap-2 text-gray-300">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyzing your business data...
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Suggestions (only show when conversation is new) */}
              {messages.length === 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8"
                >
                  {suggestions.map((suggestion, index) => (
                    <motion.button
                      key={index}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSuggestionClick(suggestion.text)}
                      className={`
                        p-4 rounded-xl backdrop-blur-xl border border-white/10 
                        bg-gradient-to-r ${suggestion.color} bg-opacity-10
                        hover:bg-opacity-20 transition-all duration-200
                        text-left group
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`
                          w-10 h-10 rounded-lg bg-gradient-to-r ${suggestion.color} 
                          flex items-center justify-center group-hover:scale-110 transition-transform
                        `}>
                          <suggestion.icon className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-white font-medium">{suggestion.text}</span>
                      </div>
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </div>
          </div>

          {/* Chat Input */}
          <div className="p-6 border-t border-white/10">
            <div className="max-w-4xl mx-auto">
              <form onSubmit={handleSubmit} className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={handleInputChange}
                  placeholder="Ask me anything about your business..."
                  disabled={isLoading}
                  className="
                    w-full bg-white/5 backdrop-blur-xl border border-white/10 
                    rounded-2xl px-6 py-4 pr-14 text-white placeholder-gray-400
                    focus:outline-none focus:border-blue-400/50 focus:bg-white/10
                    transition-all duration-200 text-lg
                  "
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="
                    absolute right-2 top-1/2 -translate-y-1/2
                    w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600
                    flex items-center justify-center
                    hover:scale-105 transition-all duration-200
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                  "
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  ) : (
                    <Send className="w-5 h-5 text-white" />
                  )}
                </button>
              </form>
            </div>
          </div>
        </motion.div>

        {/* Dynamic Widgets Panel */}
        <AnimatePresence>
          {!isFullscreen && activeWidgets.length > 0 && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: '50%', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="border-l border-white/10 bg-black/20 backdrop-blur-xl overflow-hidden"
            >
              <div className="p-6 h-full overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-white">Live Insights</h2>
                  <button
                    onClick={() => {
                      setIsFullscreen(true);
                      setActiveWidgets([]);
                    }}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    ×
                  </button>
                </div>
                
                <div className="space-y-6">
                  {activeWidgets.map((widget) => (
                    <motion.div
                      key={widget.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4"
                    >
                      <h3 className="text-lg font-medium text-white mb-4">{widget.title}</h3>
                      {widget.component}
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
