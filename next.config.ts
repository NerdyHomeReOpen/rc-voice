import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    domains: ['localhost'],
    // 如果你之後有其他網域也要加在這裡
    // 例如: 'your-production-domain.com'
  },
};

export default nextConfig;
