import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Cloudflare Pages 部署配置
  experimental: {
    // 启用 Edge Runtime 支持
  },
  
  // 允许的开发源
  allowedDevOrigins: ['*.dev.coze.site'],
  
  // 图片配置
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lf-coze-web-cdn.coze.cn',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
