#!/usr/bin/env node

// Build script to handle Netlify deployment issues
console.log('🚀 Starting build process...');

// Set build-time environment variables
process.env.NODE_ENV = 'production';
process.env.NETLIFY = 'true';
process.env.BUILD_TIME = 'true';

console.log('🔧 Build environment configured:', {
  NODE_ENV: process.env.NODE_ENV,
  NETLIFY: process.env.NETLIFY,
  BUILD_TIME: process.env.BUILD_TIME
});

// Import and run Next.js build
const { execSync } = require('child_process');

try {
  console.log('📦 Running Next.js build...');
  execSync('next build', { stdio: 'inherit' });
  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
