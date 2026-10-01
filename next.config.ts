import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Parsers run only in route handlers; keep them out of the server bundle.
  serverExternalPackages: ["unpdf", "mammoth"],
};

export default nextConfig;
