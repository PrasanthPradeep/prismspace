/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: '/index.html',
        destination: '/',
      },
      {
        source: '/config-loader.html',
        destination: '/config-loader',
      },
      {
        source: '/dev-space/:tool.html',
        destination: '/dev-space/:tool',
      },
      {
        source: '/clock-previews/:preview.html',
        destination: '/clock-previews/:preview',
      },
    ]
  },
}

module.exports = nextConfig
