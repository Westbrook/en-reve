import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
export const root = fileURLToPath(new URL("../", import.meta.url));
export const showcases = resolve(root, "..");
export const registry = JSON.parse(
  readFileSync(resolve(root, "registry/systems.json")),
);
export const profiles = JSON.parse(
  readFileSync(resolve(root, "profiles/profiles.json")),
);
export const sha = (value) => createHash("sha256").update(value).digest("hex");
export const json = (value) => JSON.stringify(value, null, 2) + "\n";
export function selectSystems(ids, available = registry) {
  if (!ids) return available;
  const requested = ids.split(",");
  if (requested.some((id) => !available.some((system) => system.id === id)))
    throw new Error("Unknown system in requested comparison matrix");
  return available.filter((system) => requested.includes(system.id));
}
export function options(args) {
  const out = { command: args[0] || "help" };
  for (let i = 1; i < args.length; i++) {
    if (!args[i].startsWith("--"))
      throw new Error(`Unexpected argument ${args[i]}`);
    const key = args[i].slice(2);
    out[key] = args[i + 1] && !args[i + 1].startsWith("--") ? args[++i] : true;
  }
  return out;
}
export function rng(seed = 20260920) {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function shuffle(values, random) {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
