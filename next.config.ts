import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // keep the dev overlay badge out of reference captures
  devIndicators: false,
};

export default nextConfig;
