export default function Custom404() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white">
      <div className="text-center max-w-md mx-auto px-6">
        <h1 className="text-6xl font-bold mb-4 opacity-90">404</h1>
        <p className="text-xl mb-8 opacity-80">
          Sorry, we couldn't find the page you're looking for.
        </p>
        <a 
          href="/" 
          className="inline-block px-6 py-3 bg-white/20 text-white rounded-lg border border-white/30 hover:bg-white/30 transition-all duration-300 hover:-translate-y-1"
        >
          Go Home
        </a>
      </div>
    </div>
  )
}
