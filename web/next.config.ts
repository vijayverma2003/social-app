import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ hostname: "i.pinimg.com" }],
  },
};

export default nextConfig;
