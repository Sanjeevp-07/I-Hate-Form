import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

function wrapContentScriptPlugin() {
  return {
    name: "wrap-content-script",
    renderChunk(code: string, chunk: any) {
      if (chunk.name === "content") {
        return `(function() {
if (typeof window !== "undefined") {
  if (window.__IHATEFORM_CONTENT_SCRIPT_RUNNING__) return;
  window.__IHATEFORM_CONTENT_SCRIPT_RUNNING__ = true;
}
${code}
})();`;
      }
      return null;
    },
  };
}

export default defineConfig({
  plugins: [react(), wrapContentScriptPlugin()],
  build: {
    modulePreload: false,
    rollupOptions: {
      input: {
        sidepanel: resolve(__dirname, "src/sidepanel/index.html"),
        background: resolve(__dirname, "src/background/service-worker.ts"),
        content: resolve(__dirname, "src/content/content-script.ts"),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === "background") return "background.js";
          if (chunkInfo.name === "content") return "content.js";
          return "assets/[name]-[hash].js";
        },
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },
    outDir: "dist",
    emptyOutDir: true,
  },
});
