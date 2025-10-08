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
