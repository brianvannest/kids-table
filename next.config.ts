import type { NextConfig } from "next";

// Small headers every page gets. None of them changes how the app looks or works:
//  - nosniff: the browser must trust the type we say a file is, not guess.
//  - frame-ancestors / X-Frame-Options: no other website may show this one inside a frame, which
//    is how "click here" tricks are staged over a real page.
//  - Referrer-Policy: when someone follows a link out, only the site's name goes along, not the page.
//  - Permissions-Policy: the app never needs the camera, microphone, or location, so it says no.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  // Don't announce which framework runs the site. It's a small thing, and there's no reason to tell strangers.
  poweredByHeader: false,
  cacheComponents: true,
  partialPrefetching: true,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
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
