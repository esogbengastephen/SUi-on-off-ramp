#!/bin/bash

echo "🚀 Starting deployment build process..."

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf .next
rm -rf node_modules/.cache

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Set environment variables for build
export NODE_ENV=production
export NEXT_TELEMETRY_DISABLED=1

# Try to build with fallback handling
echo "🔨 Building application..."
if npm run build; then
    echo "✅ Build successful!"
    exit 0
else
    echo "⚠️ Build failed, trying alternative approach..."
    
    # Try building without static optimization
    export NEXT_STATIC_EXPORT=false
    npm run build || {
        echo "❌ Build failed completely"
        exit 1
    }
fi

echo "✅ Build completed successfully!"
