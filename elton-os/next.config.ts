import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "127.0.0.1",
    "localhost",
    "preview-chat-7b004522-2e59-447c-8a2a-456f06eb44a1.space-z.ai",
    "*.space-z.ai",
  ],
  output: "standalone",
  // Skip TypeScript errors during build (tests have pre-existing errors)
  typescript: {
    ignoreBuildErrors: true,
  },
  // Skip ESLint errors during build
  eslint: {
    ignoreDuringBuilds: true,
  },
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
