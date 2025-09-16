/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Deshabilitar logs de Fast Refresh en desarrollo
  webpack: (config, { dev }) => {
    if (dev) {
      config.infrastructureLogging = {
        level: 'error',
      }
    }
    return config
  },
  // Deshabilitar logs de Vercel Analytics en desarrollo
  experimental: {
    logging: {
      level: 'error',
    },
  },
}

export default nextConfig
