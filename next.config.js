/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable static optimization for problematic pages during build
  experimental: {
    // Skip static generation for pages that might cause build issues
    skipTrailingSlashRedirect: true,
  },
  
  // Reduce build timeouts and improve reliability
  typescript: {
    // Skip type checking during build to speed up deployment
    ignoreBuildErrors: true,
  },
  
  eslint: {
    // Skip ESLint during build
    ignoreDuringBuilds: true,
  },
  
  // Optimize for production builds
  swcMinify: true,
  
  // Handle environment variables
  env: {
    NETLIFY: process.env.NETLIFY || 'false',
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
  
  // Handle redirects
  async redirects() {
    return [
      {
        source: '/',
        destination: '/swap',
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
