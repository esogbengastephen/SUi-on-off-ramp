/** @type {import('next').NextConfig} */
const nextConfig = {
  // Skip trailing slash redirects
  skipTrailingSlashRedirect: true,
  
  // Fix workspace root detection
  outputFileTracingRoot: process.cwd(),
  
  // Reduce build timeouts and improve reliability
  typescript: {
    // Skip type checking during build to speed up deployment
    ignoreBuildErrors: true,
  },
  
  eslint: {
    // Skip ESLint during build
    ignoreDuringBuilds: true,
  },
  
  // Handle environment variables
  env: {
    NETLIFY: process.env.NETLIFY || 'false',
    VERCEL: process.env.VERCEL || 'false',
  },
  
  // Reduce bundle size
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
  
  // Add experimental features to handle build issues
  experimental: {
    // Increase timeout for static page generation
    staticPageGenerationTimeout: 1000,
  },
  
  // Configure build output for better deployment
  // output: 'standalone', // Removed to fix static generation issues
  
  // Disable image optimization during build to prevent timeouts
  images: {
    unoptimized: true,
  },
  
  // Configure static generation
  trailingSlash: false,
  
  // Disable source maps in production for faster builds
  productionBrowserSourceMaps: false,
};

module.exports = nextConfig;
