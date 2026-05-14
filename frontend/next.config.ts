import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const configDir = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.join(configDir, "src");

const nextConfig: NextConfig = {
  reactCompiler: true,
  webpack: (config) => {
    config.resolve ??= {};
    config.resolve.alias ??= {};
    config.resolve.alias["@"] = srcDir;
    return config;
  },
  turbopack: {
    resolveAlias: {
      "@": srcDir,
    },
  },
};

export default nextConfig;
