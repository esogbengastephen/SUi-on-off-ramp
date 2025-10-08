// Build-time utility functions
export const isBuildTime = () => {
  return process.env.BUILD_TIME === 'true' || 
         process.env.NETLIFY === 'true' || 
         process.env.VERCEL === 'true' ||
         process.env.NODE_ENV === 'production';
};

export const getBuildTimeResponse = (fallbackData: any) => {
  return {
    ...fallbackData,
    buildTime: true,
    timestamp: new Date().toISOString(),
    message: 'Build-time response - service not available during build'
  };
};

export const handleBuildTimeCheck = (fallbackData: any) => {
  if (isBuildTime()) {
    return getBuildTimeResponse(fallbackData);
  }
  return null;
};
