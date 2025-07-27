import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      'files.cdn.printful.com',
      'images.pexels.com',
      'images.unsplash.com',
      'via.placeholder.com',
      'picsum.photos',
      'cdn.pixabay.com',
      'source.unsplash.com',
      'img.freepik.com',
      'images.stockvault.net',
      'burst.shopifycdn.com'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'files.cdn.printful.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      }
    ],
  },
};

export default nextConfig;
