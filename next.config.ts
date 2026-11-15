import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Don't announce which framework runs the site. It's a small thing, and there's no reason to tell strangers.
  poweredByHeader: false,
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
