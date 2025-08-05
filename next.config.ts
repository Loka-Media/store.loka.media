import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      'files.cdn.printful.com',
      'printful-upload.s3-accelerate.amazonaws.com',
      'images.pexels.com',
      'images.unsplash.com',
      'via.placeholder.com',
      'picsum.photos',
      'cdn.pixabay.com',
      'source.unsplash.com',
      'img.freepik.com',
      'images.stockvault.net',
      'burst.shopifycdn.com',
      'cdn.shopify.com',
      'allbuckets-1754371568222.nyc3.digitaloceanspaces.com'
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
        hostname: 'printful-upload.s3-accelerate.amazonaws.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.shopify.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'allbuckets-1754371568222.nyc3.digitaloceanspaces.com',
        port: '',
        pathname: '/**',
      }
    ],
  },
};

export default nextConfig;
