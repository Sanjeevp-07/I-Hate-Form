import { defineConfig, Plugin, build as viteBuild } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

function bundleChromeScriptsPlugin(): Plugin {
  return {
    name: "bundle-chrome-scripts",
    async writeBundle() {
      // 1. Bundle content-script.ts as standalone IIFE (100% Manifest V3 content script compliant)
      await viteBuild({
        configFile: false,
        plugins: [],
        build: {
          lib: {
            entry: resolve(__dirname, "src/content/content-script.ts"),
            name: "I_HATE_FORM_CONTENT",
            formats: ["iife"],
            fileName: () => "content.js",
          },
          outDir: resolve(__dirname, "dist"),
          emptyOutDir: false,
        },
      });

      // 2. Bundle background service worker as standalone ESM
      await viteBuild({
        configFile: false,
        plugins: [],
        build: {
          lib: {
            entry: resolve(__dirname, "src/background/service-worker.ts"),
            formats: ["es"],
            fileName: () => "background.js",
          },
          outDir: resolve(__dirname, "dist"),
          emptyOutDir: false,
        },
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), bundleChromeScriptsPlugin()],
  build: {
    modulePreload: false,
    rollupOptions: {
      input: {
        sidepanel: resolve(__dirname, "src/sidepanel/index.html"),
      },
      output: {
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },
    outDir: "dist",
    emptyOutDir: true,
  },
});
