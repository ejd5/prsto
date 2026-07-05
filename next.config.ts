import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  output: process.env.NODE_ENV === "production" ? "standalone" : undefined,
  async redirects() {
    return [
      {
        source: "/pipeline",
        destination: "/dashboard/jobs/pipeline",
        permanent: true,
      },
      {
        source: "/recruiters",
        destination: "/prsto",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
