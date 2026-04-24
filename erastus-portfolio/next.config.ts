import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["http://192.168.0.0/16"],
  images: {
    qualities: [75, 90],
  },
};

export default nextConfig;