import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /**
   * Required by FHEVM
   */
  headers() {
    return Promise.resolve([
      {
        source: "/",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "require-corp",
          },
        ],
      },
    ]);
  },

  /**
   * Fix monorepo root detection for build & Turbopack.
   * The app lives in `frontend`, the workspace root is one level up.
   */
  turbopack: {
    root: path.resolve(__dirname, ".."),
  },

  // For production output tracing
  outputFileTracingRoot: path.resolve(__dirname, ".."),
};

export default nextConfig;
