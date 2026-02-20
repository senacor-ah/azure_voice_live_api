import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Output standalone build for Docker deployment
  // This bundles all dependencies into .next/standalone
  output: "standalone",
};

export default nextConfig;
