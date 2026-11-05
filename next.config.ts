import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 📘 Day 1: typed <Link href> and router.push(). Typos in URLs become compile errors.
  typedRoutes: true,
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
