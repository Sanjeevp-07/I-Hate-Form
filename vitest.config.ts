import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
  },
  resolve: {
    alias: {
      "@internship-copilot/types": resolve(__dirname, "packages/types/src"),
      "@internship-copilot/validation": resolve(__dirname, "packages/validation/src"),
      "@internship-copilot/config": resolve(__dirname, "packages/config/src"),
      "@internship-copilot/database": resolve(__dirname, "packages/database/src"),
      "@internship-copilot/ai": resolve(__dirname, "packages/ai/src"),
    },
  },
});
