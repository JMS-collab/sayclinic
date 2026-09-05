import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // On Vercel, output: 'standalone' causes ENOENT on next-server.js.nft.json
  output: process.env.NEXT_OUTPUT_STANDALONE === "true" ? "standalone" : undefined,
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
