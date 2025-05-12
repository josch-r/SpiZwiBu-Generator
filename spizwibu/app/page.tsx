
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Station Assignment Scheduler</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Create fair station schedules with minimal effort
          </p>
        </header>
        
        {/* Main content */}
        <main className="space-y-8">
          {/* App description */}
          <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Create Fair Schedules</h2>
            <p className="mb-4">
              This application helps you distribute personnel across multiple station locations throughout a weekly schedule,
              respecting individual availability and ensuring fair distribution.
            </p>
            
            {/* Workflow steps */}
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-3">Simple workflow:</h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>Import personnel names</li>
                <li>Configure stations</li>
                <li>Generate balanced schedule</li>
                <li>Make any manual adjustments</li>
                <li>Export to CSV</li>
              </ol>
            </div>
          </section>
          
          {/* Get started button */}
          <div className="text-center mt-8">
            <Link 
              href="/import"
              className="px-6 py-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-full font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
            >
              New Session
            </Link>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
              All data stays in your browser and is cleared when you close the tab
            </p>
          </div>
        </main>
        
        {/* Footer */}
        <footer className="mt-16 text-center text-gray-500 dark:text-gray-400 text-sm">
          <p>Station Assignment Scheduler • Privacy-focused • Session-only storage</p>
        </footer>
      </div>
    </div>
  );
}