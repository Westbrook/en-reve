import { isolation } from "../tools/isolation-plugin.mjs";
import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [isolation(fileURLToPath(new URL(".", import.meta.url)))],
  resolve: {
    alias: {
      "@showcase/ui": fileURLToPath(new URL("./src/ui.js", import.meta.url)),
    },
  },
  build: { sourcemap: true },
});
