import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Bot, Sparkles, MessageCircle, BarChart3 } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
      
      <div className="relative z-10 mx-auto w-full max-w-6xl px-6 lg:px-8">
        <div className="text-center space-y-12">
          {/* Main Hero */}
          <div className="space-y-6">
            <div className="flex items-center justify-center mb-8">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
            </div>
            
            <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold tracking-tight bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent animate-in fade-in-0 slide-in-from-bottom-4 duration-1000">
              Ozza
            </h1>
            
            <p className="text-xl sm:text-2xl md:text-3xl text-gray-300 max-w-4xl mx-auto leading-relaxed animate-in fade-in-0 slide-in-from-bottom-4 duration-1000 delay-200">
              Your AI-powered business intelligence workspace.
              <br />
              <span className="text-lg text-gray-400">Conversation beats navigation.</span>
            </p>
          </div>

          {/* Features Preview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto animate-in fade-in-0 slide-in-from-bottom-4 duration-1000 delay-400">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-center">
              <MessageCircle className="w-8 h-8 text-blue-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Chat-First Interface</h3>
              <p className="text-gray-400 text-sm">Ask questions, get insights. No more clicking through dashboards.</p>
            </div>
            
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-center">
              <BarChart3 className="w-8 h-8 text-purple-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Business Intelligence</h3>
              <p className="text-gray-400 text-sm">AI analyzes your data and provides actionable insights.</p>
            </div>
            
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-center">
              <Bot className="w-8 h-8 text-green-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">AI Assistant</h3>
              <p className="text-gray-400 text-sm">Your personal business analyst, available 24/7.</p>
            </div>
          </div>
          
          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-1000 delay-600">
            <Button asChild size="lg" className="w-full sm:w-auto group transition-all duration-300 hover:scale-105 hover:shadow-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0">
              <Link href="/auth/signin" prefetch={true}>
                <MessageCircle className="w-5 h-5 mr-2" />
                <span className="text-nowrap font-medium">Start Chatting</span>
              </Link>
            </Button>
            
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto group transition-all duration-300 hover:scale-105 hover:shadow-lg border-white/20 text-white hover:bg-white/10">
              <Link href="/console" prefetch={true}>
                <span className="text-nowrap font-medium">Management Console</span>
              </Link>
            </Button>
          </div>
          
          {/* Demo Preview */}
          <div className="mt-16 animate-in fade-in-0 slide-in-from-bottom-4 duration-1000 delay-800">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 max-w-2xl mx-auto">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm text-gray-400">Ozza AI</span>
              </div>
              <div className="text-left text-gray-300 space-y-2">
                <p>"How are my projects performing this month?"</p>
                <div className="text-sm text-gray-500 italic">
                  → AI analyzes your data and shows: 85% completion rate, 3 overdue projects, $45K revenue...
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-center animate-in fade-in-0 slide-in-from-bottom-4 duration-1000 delay-1000">
            <p className="text-sm text-gray-500">
              The future of business management is conversational.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
