import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: "i.pinimg.com" },
      { hostname: "148f898dfb83515177fe5c9d4b24c0fa.r2.cloudflarestorage.com" },
      {
        protocol: "https",
        hostname: "*.r2.dev", // allows any subdomain like pub-xxxxx.r2.dev
        pathname: "/attachments/**", // or '/**' to allow any path
      },
    ],
  },
};

export default nextConfig;
