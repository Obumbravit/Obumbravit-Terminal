/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  ...(process.env.NODE_ENV === 'production' && {
    basePath: '/Obumbravit-Terminal',
    assetPrefix: '/Obumbravit-Terminal/',
  }),
  images: {
    unoptimized: true
  }
}

module.exports = nextConfig
