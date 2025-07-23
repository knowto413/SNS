/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath: process.env.NODE_ENV === 'production' ? '/kiji' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/kiji/' : '',
  images: {
    unoptimized: true
  },
  env: {
    STATIC_EXPORT: process.env.NODE_ENV === 'production' ? 'true' : 'false'
  }
}

module.exports = nextConfig