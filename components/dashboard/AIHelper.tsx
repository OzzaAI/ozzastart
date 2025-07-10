'use client';

import { useState } from 'react';
import { Bot, X, Send, Sparkles, Loader2 } from 'lucide-react';
import { useChat } from 'ai/react';

interface AIHelperProps {
  context?: string;
}

export default function AIHelper({ context = "dashboard" }: AIHelperProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  
  const { messages, input, handleInputChange, handleSubmit, isLoading, error, append } = useChat({
    api: '/api/ai/chat',
    initialMessages: [
      {
        id: '1',
        role: 'assistant',
        content: `Hi! I'm your Ozza AI assistant. I can help you analyze your business data, understand project status, and provide insights about your ${context}. What would you like to know?`
      }
    ],
    onFinish: () => {
      setShowSuggestions(false);
    }
  });

  const suggestions = [
    "How are my projects performing this month?",
    "What's my project completion rate?",
    "Show me overdue projects",
    "Analyze my team's productivity",
    "What insights do you have about my business?"
  ];

  const handleSuggestionClick = (suggestion: string) => {
    setShowSuggestions(false);
    append({ role: 'user', content: suggestion });
  };

  return (
    <>
      {/* AI Helper Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-xl border border-blue-400/30 rounded-full p-3 shadow-lg hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105 group"
        >
          <Bot className="w-6 h-6 text-blue-300 group-hover:text-blue-200" />
        </button>
      </div>

      {/* AI Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-6 w-80 h-96 bg-gradient-to-br from-black/80 to-gray-900/80 backdrop-blur-xl border border-white/10 rounded-xl shadow-xl z-40">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-medium">Ozza AI</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 h-64 overflow-y-auto space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg text-sm ${
                    msg.role === 'user'
                      ? 'bg-blue-500/20 text-blue-100 border border-blue-400/30'
                      : 'bg-white/5 text-gray-200 border border-white/10'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white/5 text-gray-200 border border-white/10 p-3 rounded-lg text-sm flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing your business data...
                </div>
              </div>
            )}

            {error && (
              <div className="flex justify-start">
                <div className="bg-red-500/20 text-red-200 border border-red-400/30 p-3 rounded-lg text-sm">
                  Sorry, I couldn't process that request. Please try again.
                </div>
              </div>
            )}

            {/* Suggestions */}
            {showSuggestions && messages.length === 1 && (
              <div className="space-y-2">
                <div className="text-xs text-gray-400 px-1">Try asking:</div>
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg p-2 text-xs text-gray-300 transition-all duration-200"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-white/10">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={handleInputChange}
                placeholder="Ask about your projects, revenue, team performance..."
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-blue-400/50"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="bg-blue-500/20 border border-blue-400/30 rounded-lg p-2 hover:bg-blue-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-blue-300" />
                ) : (
                  <Send className="w-4 h-4 text-blue-300" />
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}