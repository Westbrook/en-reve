import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const projects = [
  "radix-react",
  "fluent-react",
  "spectrum-react",
  "astryx-react",
  "shadcn-react",
  "fluent-web-components",
  "spectrum-web-components",
  "en-reve",
  "web-awesome",
  "tools",
];
for (const name of projects) {
  if (process.env.SHOWCASE_FILTER && !process.env.SHOWCASE_FILTER.split(",").includes(name)) continue;
  console.log(`Installing ${name}`);
  const r = spawnSync(
    "npm",
    ["ci", "--workspaces=false", "--no-audit", "--no-fund"],
    {
      cwd: fileURLToPath(new URL("../" + name, import.meta.url)),
      stdio: "inherit",
    },
  );
  if (r.status !== 0) process.exit(r.status ?? 1);
}
