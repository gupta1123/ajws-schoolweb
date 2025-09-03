import type { NextConfig } from "next";
import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  // Enable optimizations
  images: {
    formats: ['image/webp', 'image/avif'],
    domains: [
      'ajws-school-ba8ae5e3f955.herokuapp.com',
      'xwqdfnggfamvfiqzpdft.supabase.co'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ajws-school-ba8ae5e3f955.herokuapp.com',
        pathname: '/api/homework/**',
      },
      {
        protocol: 'https',
        hostname: 'xwqdfnggfamvfiqzpdft.supabase.co',
        pathname: '/storage/v1/object/public/homework-attachments/**',
      },
    ],
  },
  experimental: {
    optimizeCss: true,
  },
  // Add proxy for API requests to avoid CORS issues
  async rewrites() {
    return [
      {
        source: '/api/proxy/:path*',
        destination: 'https://ajws-school-ba8ae5e3f955.herokuapp.com/api/:path*',
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
