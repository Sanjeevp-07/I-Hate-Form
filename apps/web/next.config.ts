import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@internship-copilot/types",
    "@internship-copilot/validation",
    "@internship-copilot/config",
    "@internship-copilot/database",
    "@internship-copilot/ai",
  ],
};

export default nextConfig;
