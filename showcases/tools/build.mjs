import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
export const projects = [
  "radix-react",
  "fluent-react",
  "spectrum-react",
  "astryx-react",
  "shadcn-react",
  "fluent-web-components",
  "spectrum-web-components",
  "en-reve",
  "web-awesome",
];
for (const name of projects) {
  if (process.env.SHOWCASE_FILTER && !process.env.SHOWCASE_FILTER.split(",").includes(name)) continue;
  console.log(`\nBuilding ${name}`);
  const result = spawnSync("npm", ["run", "build"], {
    cwd: fileURLToPath(new URL("../" + name, import.meta.url)),
    stdio: "inherit",
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
