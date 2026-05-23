import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },

  experimental: {
    serverActions: {
      // Restrict server-action origins to our deployed domains + localhost.
      // Anything else is rejected by Next.js before the action runs — this
      // closes a CSRF vector specific to App Router server actions.
      allowedOrigins: [
        "localhost:3000",
        "employee-portal-flame.vercel.app",
      ],
    },
  },

  // Note: Top-level security headers are applied via middleware.ts so they
  // can vary per route (e.g. tighter CSP on /api/*). We keep next.config.ts
  // free of header overrides to avoid two sources of truth.
};

export default nextConfig;
