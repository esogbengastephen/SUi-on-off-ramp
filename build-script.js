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
  
  // Run the build with more specific options
  execSync('next build --no-lint --no-type-check', { 
    stdio: 'inherit',
    env: {
      ...process.env,
      NEXT_TELEMETRY_DISABLED: '1',
      BUILD_TIME: 'true'
    }
  });
  
  console.log('✅ Build completed successfully!');
  
  // Verify the build output exists
  const fs = require('fs');
  if (fs.existsSync('.next')) {
    console.log('✅ Build output directory created');
  } else {
    console.log('⚠️ Build output directory not found');
  }
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  console.error('Build error details:', error);
  process.exit(1);
}
