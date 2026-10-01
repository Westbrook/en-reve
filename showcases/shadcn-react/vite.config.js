import { isolation } from "../tools/isolation-plugin.mjs";
import { defineConfig } from "vite";
import tailwind from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
export default defineConfig({
  plugins: [
    isolation(fileURLToPath(new URL(".", import.meta.url))),
    react(),
    tailwind(),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@showcase/ui": fileURLToPath(new URL("./src/ui.jsx", import.meta.url)),
      react: fileURLToPath(new URL("./node_modules/react", import.meta.url)),
      "react-dom": fileURLToPath(
        new URL("./node_modules/react-dom", import.meta.url),
      ),
    },
  },
  build: { sourcemap: true },
});
