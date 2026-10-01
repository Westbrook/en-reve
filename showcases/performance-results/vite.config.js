import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import { isolation } from "../tools/isolation-plugin.mjs";
export default defineConfig({
  plugins: [isolation(fileURLToPath(new URL(".", import.meta.url)))],
});
