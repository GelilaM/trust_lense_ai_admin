import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/proxy/:path*",
        destination: "http://192.168.7.180:8000/:path*",
      },
    ];
  },
};

export default nextConfig;
