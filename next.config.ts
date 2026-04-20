import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    // Enable server actions
  },
  // Allow larger request bodies for homework photo uploads
  // Default Next.js limit is 4MB; images can be larger
  serverExternalPackages: [],
}

export default nextConfig
