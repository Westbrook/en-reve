import {
  readdir,
  readFile,
  writeFile,
  mkdir,
  cp,
  access,
  rename,
} from "node:fs/promises";
import { resolve, relative } from "node:path";
import { gzipSync, brotliCompressSync, constants } from "node:zlib";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { build } from "esbuild";
import { init, parse } from "es-module-lexer";
import { root, showcases, registry, sha, json, options, selectSystems } from "./config.mjs";
import { receiptPaths, composeVerificationReceipts } from "./verification-receipts.mjs";
export async function archiveSnapshot(target, canonicalArchive, previous, reason) {
  await mkdir(resolve(canonicalArchive, ".."), { recursive: true });
  let archive = canonicalArchive;
  for (;;) {
    let occupied = false;
    for (const path of [archive, archive + ".json"]) {
      try { await access(path); occupied = true; }
      catch (error) { if (error.code !== "ENOENT") throw error; }
    }
    if (occupied) { archive = canonicalArchive + "-" + randomUUID(); continue; }
    try { await rename(target, archive); break; }
    catch (error) {
      if (!["EEXIST", "ENOTEMPTY"].includes(error.code)) throw error;
      archive = canonicalArchive + "-" + randomUUID();
    }
  }
  await writeFile(archive + ".json", json({ ...previous, archivedAt: new Date().toISOString(), reason }), { flag: "wx" });
  return archive;
}
export function additiveInventory(previous, entries, reason, sourceReceipts) {
  for (const entry of entries)
    if (previous.systems.some((system) => system.id === entry.id))
      throw new Error(`Additive preparation cannot replace ${entry.id}`);
  const pendingSystems = [...new Set([
    ...(previous.pendingSystems || (previous.requiresFunctionalQualification
      ? previous.systems.map((system) => system.id) : [])),
    ...entries.map((system) => system.id),
  ])];
  return {
    ...previous,
    preparedAt: new Date().toISOString(),
    systems: [...previous.systems, ...entries],
    pendingSystems,
    requiresFunctionalQualification: pendingSystems.length > 0,
    qualificationHistory: [...(previous.qualificationHistory || []), previous.qualification],
    qualification: { status: "pending-addition", reason, pendingSystems, ...(sourceReceipts ? { sourceReceipts } : {}) },
  };
}
export function selectedInventory(previous, entries, reason, sourceReceipts) {
  for (const entry of entries)
    if (!previous.systems.some((system) => system.id === entry.id))
      throw new Error(`Selected refresh cannot add ${entry.id}; use --add`);
  const pendingSystems = [...new Set([
    ...(previous.pendingSystems || (previous.requiresFunctionalQualification
      ? previous.systems.map((system) => system.id) : [])),
    ...entries.map((system) => system.id),
  ])];
  return {
    ...previous,
    preparedAt: new Date().toISOString(),
    systems: previous.systems.map((system) => entries.find((entry) => entry.id === system.id) || system),
    pendingSystems,
    requiresFunctionalQualification: pendingSystems.length > 0,
    qualificationHistory: [...(previous.qualificationHistory || []), previous.qualification],
    qualification: { status: "pending-selected-refresh", reason, pendingSystems, ...(sourceReceipts ? { sourceReceipts } : {}) },
  };
}
export async function files(dir) {
  const result = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = resolve(dir, entry.name);
    if (entry.isDirectory()) result.push(...(await files(path)));
    else result.push(path);
  }
  return result.sort();
}
export function encodings(data) {
  return {
    identity: data,
    gzip: gzipSync(data, { level: 9 }),
    br: brotliCompressSync(data, {
      params: { [constants.BROTLI_PARAM_QUALITY]: 11 },
    }),
  };
}
export async function assetManifest(dir) {
  await init;
  const result = [];
  for (const path of await files(dir)) {
    const data = await readFile(path),
      name = relative(dir, path),
      encoded = encodings(data);
    const item = {
      path: name,
      sha256: sha(data),
      raw: data.length,
      gzip: encoded.gzip.length,
      brotli: encoded.br.length,
      diagnostic: name.endsWith(".map") || name === "build-metadata.json",
    };
    if (name.endsWith(".js")) {
      const [imports] = parse(data.toString());
      item.imports = imports
        .filter((x) => x.specifier)
        .map((x) => ({
          specifier: x.specifier,
          dynamic: x.type === "dynamic",
        }));
    }
    result.push(item);
  }
  return result;
}
export async function prepare(args = {}) {
  if (args.systems && !args.add && !args.refresh && !args.candidate)
    throw new Error("Selected preparation requires --add, --refresh or --candidate and an explicit reason");
  if (args.add && (!args.systems || !args.receipt || !args.reason || args.refresh || args.candidate))
    throw new Error("Additive preparation requires --systems, --receipt and --reason; refresh/candidate cannot be combined");
  if ((args.refresh || args.candidate) && !args.reason)
    throw new Error("Snapshot refresh/candidate preparation requires --reason");
  const selected = selectSystems(args.systems);
  const defaults = JSON.parse(await readFile(resolve(root, "registry/verification-receipts.json")));
  const receipt = composeVerificationReceipts(await Promise.all(
    receiptPaths(args, defaults).map(async (path) => {
      const bytes = await readFile(resolve(showcases, path));
      return { path, data: JSON.parse(bytes), sha256: sha(bytes) };
    }),
  ), selected);
  // Preflight the entire selection before creating or replacing any snapshot.
  if (!args.candidate)
    for (const verified of receipt.projects)
      for (const [name, expected] of Object.entries({
        ...verified.sourceHashes,
        ...verified.outputHashes,
      })) {
        if (sha(await readFile(resolve(showcases, name))) !== expected)
          throw new Error(
            `Frozen verification mismatch: ${name}. Use --candidate --reason to prepare a new, initially unqualified build.`,
          );
      }
  await mkdir(resolve(root, ".cache"), { recursive: true });
  const previous = args.add || args.systems
    ? JSON.parse(await readFile(resolve(root, ".cache/inventory.json")))
    : null;
  if (args.systems && !args.add) selectedInventory(previous, selected, args.reason);
  if (args.add) {
    additiveInventory(previous, selected, args.reason);
    for (const system of selected) {
      for (const target of [
        resolve(root, ".cache/snapshots", system.id),
        resolve(root, ".cache/snapshots", system.id + ".json"),
      ]) {
        try { await access(target); }
        catch (error) { if (error.code === "ENOENT") continue; throw error; }
        throw new Error(`Additive preparation refuses an existing snapshot: ${target}`);
      }
    }
  }
  const entries = [];
  for (const system of selected) {
    const verified = receipt.projects.find((p) => p.name === system.id);
    const target = resolve(root, ".cache/snapshots", system.id);
    const sourceAssets = await assetManifest(
      resolve(showcases, system.id, "dist"),
    );
    const fingerprint = sha(json(sourceAssets.map((a) => [a.path, a.sha256])));
    try {
      const previous = JSON.parse(
        await readFile(resolve(target, "../", system.id + ".json")),
      );
      if (
        sha(json(previous.assets.map((a) => [a.path, a.sha256]))) !==
        fingerprint
      ) {
        if (!args.refresh && !args.candidate)
          throw new Error(
            `Snapshot ${system.id} changed; preserve/promote the prior baseline explicitly with --refresh --reason.`,
          );
        const archive = resolve(
          root,
          ".cache/archive",
          system.id + "-" + previous.fingerprint,
        );
        await archiveSnapshot(target, archive, previous, args.reason);
      }
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    await mkdir(target, { recursive: true });
    await cp(resolve(showcases, system.id, "dist"), target, {
      recursive: true,
    });
    let sourceHashes = verified.sourceHashes;
    if (args.candidate)
      sourceHashes = Object.fromEntries(
        await Promise.all(
          Object.keys(verified.sourceHashes).map(async (name) => [
            name,
            sha(await readFile(resolve(showcases, name))),
          ]),
        ),
      );
    const receiptSource = receipt.sources.find((source) => source.systems.includes(system.id));
    const entry = {
      ...system,
      verificationReceipt: { path: receiptSource.path, sha256: receiptSource.sha256, verifiedAt: receiptSource.verifiedAt },
      fingerprint,
      sourceSha256: args.candidate
        ? sha(json(sourceHashes))
        : verified.sourceSha256,
      sourceHashes,
      sourceHashScope: args.candidate
        ? "Previously qualified source paths; all emitted artifacts independently hashed, including newly introduced modules."
        : "Original functional receipt",
      build: JSON.parse(await readFile(resolve(target, "build-metadata.json"))),
      assets: sourceAssets,
    };
    await writeFile(resolve(target, "../", system.id + ".json"), json(entry));
    entries.push(entry);
  }
  const cert = resolve(root, ".cache/cert.pem"),
    key = resolve(root, ".cache/key.pem");
  try {
    await access(cert);
  } catch {
    execFileSync(
      "openssl",
      [
        "req",
        "-x509",
        "-newkey",
        "rsa:2048",
        "-nodes",
        "-keyout",
        key,
        "-out",
        cert,
        "-days",
        "30",
        "-subj",
        "/CN=localhost",
        "-addext",
        "subjectAltName=DNS:localhost,IP:127.0.0.1",
      ],
      { stdio: "ignore" },
    );
  }
  await build({
    entryPoints: [resolve(root, "src/collector.js")],
    outfile: resolve(root, ".cache/collector.js"),
    bundle: true,
    format: "iife",
    platform: "browser",
    minify: true,
  });
  await writeFile(
    resolve(root, ".cache/inventory.json"),
    json(args.add ? additiveInventory(previous, entries, args.reason, receipt.sources)
      : args.systems ? selectedInventory(previous, entries, args.reason, receipt.sources) : {
      schema: 1,
      preparedAt: new Date().toISOString(),
      requiresFunctionalQualification: Boolean(args.candidate),
      qualification: args.candidate
        ? { status: "pending", reason: args.reason, sourceReceipts: receipt.sources }
        : {
            at: receipt.verifiedAt,
            checksPassed: receipt.checksPassed,
            status: "frozen-receipt-verified",
            sourceReceipts: receipt.sources,
          },
      systems: entries,
    }),
  );
  console.log(
    `Prepared ${entries.length} verified snapshots${previous ? `; preserved ${previous.systems.length - (args.add ? 0 : entries.length)} unselected snapshots` : ""}; TLS certificate stays local to the harness.`,
  );
}
if (process.argv[1] === new URL(import.meta.url).pathname)
  await prepare(options(["prepare", ...process.argv.slice(2)]));
