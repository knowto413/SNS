/** @type {import('next').NextConfig} */
const isGitHubPages = process.env.NEXT_PUBLIC_VERCEL_ENV === 'github'

const nextConfig = {
  output: isGitHubPages ? 'export' : undefined,
  trailingSlash: isGitHubPages,
  basePath: isGitHubPages ? '/kiji' : '',
  assetPrefix: isGitHubPages ? '/kiji/' : '',
  images: {
    unoptimized: true
  },
  env: {
    STATIC_EXPORT: isGitHubPages ? 'true' : 'false'
  }
}

module.exports = nextConfig