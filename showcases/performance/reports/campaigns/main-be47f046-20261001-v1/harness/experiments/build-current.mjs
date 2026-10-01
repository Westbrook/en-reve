import {singlePackOutput} from '../../../tooling/test-pipeline/npm-pack.mjs';
// Build the library under test into a separate consuming project. Frozen vendor tarballs are never overwritten.
import { readFile, writeFile, mkdir, cp, rename, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { spawn } from "node:child_process";
import { root, showcases, json, sha } from "../src/config.mjs";
import { assetManifest } from "../src/prepare.mjs";
const repo = resolve(showcases, ".."),
  workspace = resolve(root, ".cache/current-consumer"),
  consumer = resolve(workspace, "en-reve");
async function command(command, args, cwd, capture = false) {
  return new Promise((resolve, reject) => {
    let output = "";
    const child = spawn(command, args, {
      cwd,
      stdio: capture ? ["ignore", "pipe", "inherit"] : "inherit",
    });
    child.stdout?.on("data", (data) => {
      output += data;
    });
    child.on("error", reject);
    child.on("exit", (code) =>
      code === 0
        ? resolve(output)
        : reject(new Error(`${command} ${args.join(" ")} exited ${code}`)),
    );
  });
}
await mkdir(resolve(consumer, "vendor"), { recursive: true });
for (const folder of ["src"])
  await cp(resolve(showcases, "en-reve", folder), resolve(consumer, folder), {
    recursive: true,
  });
for (const name of [
  "index.html",
  "vite.config.js",
  ".npmrc",
  "package-lock.json",
])
  await cp(resolve(showcases, "en-reve", name), resolve(consumer, name));
await cp(resolve(showcases, "shared"), resolve(workspace, "shared"), {
  recursive: true,
});
await mkdir(resolve(workspace, "tools"), { recursive: true });
await cp(
  resolve(showcases, "tools/isolation-plugin.mjs"),
  resolve(workspace, "tools/isolation-plugin.mjs"),
);
const pkg = JSON.parse(
    await readFile(resolve(showcases, "en-reve/package.json")),
  ),
  packages = [];
for (const name of ["tokens", "styles", "primitives", "elements"]) {
  await command("npm", ["run", "build", "-w", "@en-reve/" + name], repo);
  const packed = singlePackOutput(
    await command(
      "npm",
      [
        "pack",
        "--ignore-scripts",
        "--json",
        "--pack-destination",
        resolve(consumer, "vendor"),
      ],
      resolve(repo, "packages", name),
      true,
    ),
    "@en-reve/" + name,
  );
  const data = await readFile(resolve(consumer, "vendor", packed.filename)),
    hash = sha(data),
    filename = packed.filename.replace(
      ".tgz",
      "-" + hash.slice(0, 12) + ".tgz",
    );
  await rename(
    resolve(consumer, "vendor", packed.filename),
    resolve(consumer, "vendor", filename),
  );
  pkg.dependencies["@en-reve/" + name] = "file:vendor/" + filename;
  packages.push({ name: "@en-reve/" + name, filename, sha256: hash });
}
await writeFile(resolve(consumer, "package.json"), json(pkg));
await command(
  "npm",
  ["install", "--workspaces=false", "--no-audit", "--no-fund"],
  consumer,
);
await command("npm", ["run", "build"], consumer);
const target = resolve(root, ".cache/variants/current-en-reve");
await rm(target, { recursive: true, force: true });
await cp(resolve(consumer, "dist"), target, { recursive: true });
const assets = await assetManifest(target),
  entry = {
    id: "current-en-reve",
    description:
      "Current root library packages in a separate clean consuming project, using the unchanged native showcase source.",
    cohort: "current-library-native",
    packages,
    lockfileSha256: sha(await readFile(resolve(consumer, "package-lock.json"))),
    assets,
    fingerprint: sha(json(assets.map((a) => [a.path, a.sha256]))),
    qualification:
      "Requires functional --variant current-en-reve before measurement",
  };
let experiments = [];
try {
  experiments = JSON.parse(
    await readFile(resolve(root, "reports/en-reve-experiments.json")),
  );
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
await writeFile(
  resolve(root, "reports/en-reve-experiments.json"),
  json([...experiments.filter((e) => e.id !== entry.id), entry]),
);
console.log(
  "Built current-en-reve without changing the native baseline vendor files. Qualify this candidate before profiling.",
);
