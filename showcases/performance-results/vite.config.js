import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import { isolation } from "../tools/isolation-plugin.mjs";
import { reportBase } from "./scripts/deployment.mjs";
export default defineConfig({
  base: reportBase(process.env.PERF_REPORT_BASE),
  build: { outDir: process.env.PERF_REPORT_OUTPUT ?? "dist" },
  plugins: [isolation(fileURLToPath(new URL(".", import.meta.url)))],
});
