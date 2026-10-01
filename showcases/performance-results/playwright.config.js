import { pipelineOutput } from '../../tooling/test-pipeline/config-output.mjs';
import { defineConfig } from "@playwright/test";
const externalURL=process.env.EN_READER_ORIGIN;
export default defineConfig({
  forbidOnly: true,
  testDir: "./tests",
  testMatch: "**/*.spec.js",
  fullyParallel: false,
  workers: 3,
  reporter: [
    ["list"],
    ["json", { outputFile: "artifacts/browser-tests.json" }],
  ],
  use: { baseURL: externalURL ?? "http://127.0.0.1:4188" },
  projects: [
    { name: "chromium", use: { browserName: "chromium" } },
    { name: "firefox", use: { browserName: "firefox" } },
    { name: "webkit", use: { browserName: "webkit" } },
  ],
  webServer: externalURL ? undefined : {
    command: "npm run preview",
    url: "http://127.0.0.1:4188",
    reuseExistingServer: process.env.EN_EXECUTION_OWN_SERVERS !== '1',
  },
}, pipelineOutput(import.meta.url));
