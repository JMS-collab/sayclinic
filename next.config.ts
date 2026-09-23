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
};

export default nextConfig;
