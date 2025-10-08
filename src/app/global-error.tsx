'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <div className="min-h-screen bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center text-white">
          <div className="text-center max-w-md mx-auto px-6">
            <h1 className="text-6xl font-bold mb-4 opacity-90">Error</h1>
            <p className="text-xl mb-8 opacity-80">
              Something went wrong! Please try again.
            </p>
            <div className="space-y-4">
              <button
                onClick={reset}
                className="inline-block px-6 py-3 bg-white/20 text-white rounded-lg border border-white/30 hover:bg-white/30 transition-all duration-300 hover:-translate-y-1 mr-4"
              >
                Try Again
              </button>
              <a 
                href="/" 
                className="inline-block px-6 py-3 bg-white/20 text-white rounded-lg border border-white/30 hover:bg-white/30 transition-all duration-300 hover:-translate-y-1"
              >
                Go Home
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
