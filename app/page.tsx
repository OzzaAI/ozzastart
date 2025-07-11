import Link from 'next/link'

export default function HomePage() {
  return (
    <main id="main-content" className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-slate-900 dark:text-slate-100 mb-6">
          Welcome to{' '}
          <span className="bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
            Ozza-Reboot
          </span>
        </h1>
        
        <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-2xl mx-auto">
          AI-powered SaaS dashboard with Grok 4 integration, accessibility features, 
          and internationalization support for global reach.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
              🤖 Grok 4 Integration
            </h3>
            <p className="text-slate-600 dark:text-slate-300">
              Advanced AI capabilities with 256K context window and parallel tool execution
            </p>
          </div>
          
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
              ♿ Accessibility First
            </h3>
            <p className="text-slate-600 dark:text-slate-300">
              WCAG 2.1 AA compliant with screen reader support and keyboard navigation
            </p>
          </div>
          
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
              🌍 Global Ready
            </h3>
            <p className="text-slate-600 dark:text-slate-300">
              Multi-language support with English, Spanish, and French translations
            </p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/en/dashboard"
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Go to Dashboard
          </Link>
          
          <Link
            href="/en/chat"
            className="inline-flex items-center justify-center px-6 py-3 border border-slate-300 dark:border-slate-600 text-base font-medium rounded-md text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Try AI Chat
          </Link>
        </div>
        
        <div className="mt-12 text-sm text-slate-500 dark:text-slate-400">
          <p>
            Features: Coach Mode • Marketplace • Admin Dashboard • Security Monitoring
          </p>
        </div>
      </div>
    </main>
  )
}
