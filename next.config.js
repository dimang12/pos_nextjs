/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true,
    domains: ['localhost'],
  },
  experimental: {
    // Exclude API routes from static export
    outputFileTracingExcludes: {
      '/api/**/*': ['./node_modules/**/*'],
    },
  }
}

module.exports = nextConfig 