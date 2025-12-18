/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // Enable for Docker builds
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'http',
        hostname: '35.173.211.34',
      },
      {
        protocol: 'http',
        hostname: '35-173-211-34.nip.io',
      },
      {
        protocol: 'http',
        hostname: 'lusbookreview.space',
      },
      {
        protocol: 'https',
        hostname: 'lusbookreview.space',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'books.google.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'lh4.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'lh5.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'lh6.googleusercontent.com',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api',
  },
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: process.env.NEXT_PUBLIC_BASE_URL ? `${process.env.NEXT_PUBLIC_BASE_URL}/uploads/:path*` : 'http://backend:5001/uploads/:path*',
      },
    ]
  },
}

module.exports = nextConfig