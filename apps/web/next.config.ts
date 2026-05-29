import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: [
    '@proyectointegrador/domain',
    '@proyectointegrador/application',
    '@proyectointegrador/shared-infra',
    '@proyectointegrador/design-tokens',
    '@proyectointegrador/assets',
  ],
}

export default nextConfig
