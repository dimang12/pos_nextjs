/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true,
    domains: ['localhost'],
  },
  // Disable server-side features since we're using static export
  experimental: {
    appDir: true,
  },
};

module.exports = nextConfig; 