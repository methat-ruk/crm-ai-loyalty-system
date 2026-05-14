import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const configDir = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.join(configDir, "src");
const componentsDir = path.join(srcDir, "components");
const hooksDir = path.join(srcDir, "hooks");
const libDir = path.join(srcDir, "lib");
const servicesDir = path.join(srcDir, "services");
const storesDir = path.join(srcDir, "stores");

const nextConfig: NextConfig = {
  reactCompiler: true,
  webpack: (config) => {
    config.resolve ??= {};
    config.resolve.alias ??= {};
    config.resolve.alias["@"] = srcDir;
    config.resolve.alias["@/components"] = componentsDir;
    config.resolve.alias["@/hooks"] = hooksDir;
    config.resolve.alias["@/lib"] = libDir;
    config.resolve.alias["@/services"] = servicesDir;
    config.resolve.alias["@/stores"] = storesDir;
    return config;
  },
  turbopack: {
    resolveAlias: {
      "@": srcDir,
      "@/components": componentsDir,
      "@/hooks": hooksDir,
      "@/lib": libDir,
      "@/services": servicesDir,
      "@/stores": storesDir,
    },
  },
};

export default nextConfig;
