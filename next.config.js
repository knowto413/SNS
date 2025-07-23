/** @type {import('next').NextConfig} */
const isGitHubPages = process.env.NEXT_PUBLIC_VERCEL_ENV === 'github'

const nextConfig = {
  output: isGitHubPages ? 'export' : undefined,
  trailingSlash: isGitHubPages,
  basePath: isGitHubPages ? '/SNS' : '',
  assetPrefix: isGitHubPages ? '/SNS/' : '',
  images: {
    unoptimized: true
  },
  env: {
    NEXT_PUBLIC_STATIC_EXPORT: isGitHubPages ? 'true' : 'false'
  }
}

module.exports = nextConfig