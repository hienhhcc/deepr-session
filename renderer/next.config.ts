import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  distDir: ".next",
  assetPrefix: "./",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
