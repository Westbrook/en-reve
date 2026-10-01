import { fileURLToPath } from "node:url";
import { isolation } from "../tools/isolation-plugin.mjs";
import { defineConfig } from "vite";
export default defineConfig({
  plugins: [isolation(fileURLToPath(new URL(".", import.meta.url)))],
  build: { sourcemap: true },
});
