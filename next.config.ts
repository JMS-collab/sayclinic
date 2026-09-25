import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // On Vercel, output: 'standalone' causes ENOENT on next-server.js.nft.json
  output: process.env.NEXT_OUTPUT_STANDALONE === "true" ? "standalone" : undefined,
  typescript: {
    ignoreBuildErrors: true,
  },
  allowedDevOrigins: [
    "*.run.app",
    "ais-dev-rnto3w6zctvwxihks35uet-863428719280.europe-west2.run.app",
    "ais-pre-rnto3w6zctvwxihks35uet-863428719280.europe-west2.run.app",
  ],
  experimental: {
    cpus: 1,
  },
  turbopack: {},
  webpack: (config) => {
    if (config.optimization) {
      config.optimization.minimize = false;
    }
    return config;
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
