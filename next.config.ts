import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    // Enable server actions
  },
  async rewrites() {
    return [
      {
        source: '/',
        destination: '/index.html',
      },
    ]
  },
}

export default nextConfig
