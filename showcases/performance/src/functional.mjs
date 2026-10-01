import { readFile, writeFile, mkdir, cp, access } from "node:fs/promises";
import { resolve } from "node:path";
import { spawn } from "node:child_process";
import { root, showcases, registry, json, selectSystems } from "./config.mjs";
import { startServers } from "./server.mjs";
export async function functional(args) {
  const engine = args.engine || "chromium";
  if (!["chromium", "firefox", "webkit"].includes(engine))
    throw new Error("Unknown browser engine");
  if (args.variant && args.systems && args.systems !== "en-reve")
    throw new Error("En Reve consumer variants require --systems en-reve");
  const systems = selectSystems(args.variant ? "en-reve" : args.systems);
  if (args.id && !/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(args.id)) throw new Error("Invalid functional run id");
  const name = (args.id ? args.id + "-" : "") +
      (args.variant || args.systems?.replaceAll(",", "-") || "native") + (engine === "chromium" ? "" : "-" + engine),
    scratch = resolve(root, ".cache/qualification"),
    artifacts = resolve(scratch, name);
  await mkdir(scratch, { recursive: true });
  const reportPath = resolve(root, "reports", "functional-" + name + ".json");
  if (args.id) {
    try { await access(reportPath); throw new Error("Functional receipt already exists: " + reportPath); }
    catch (error) { if (error.code !== "ENOENT") throw error; }
  }
  await mkdir(artifacts, { recursive: !args.id });
  const inventoryPath = resolve(root, ".cache/inventory.json");
  let receipt, failure;
  let failed = false;
  const stop = await startServers({ systems, variant: args.variant });
  try {
    const inventory = JSON.parse(await readFile(inventoryPath));
    receipt = { at: new Date().toISOString(), name, engine, suites: [],
      fingerprints: Object.fromEntries(systems.map((system) => [system.id,
        inventory.systems.find((entry) => entry.id === system.id)?.fingerprint])),
    };
    if (args.variant)
      receipt.variantFingerprint = JSON.parse(
        await readFile(resolve(root, "reports/en-reve-experiments.json")),
      ).find((e) => e.id === args.variant)?.fingerprint;
    for (const suite of ["smoke", "secondary"]) {
      let source = await readFile(
        resolve(showcases, "tools", suite + ".mjs"),
        "utf8",
      );
      source = source
        .replaceAll('"http://127.0.0.1:"', '"https://127.0.0.1:"')
        .replaceAll("4510 + i", "4610 + i")
        .replaceAll("newPage({", "newPage({ ignoreHTTPSErrors: true,");
      if (engine !== "chromium")
        source = source.replace(
          "import { chromium, expect }",
          "import { " + engine + " as chromium, expect }",
        );
      source = source.replace(
        "results.push({ name: names[i], checks, errors });",
        "results.push({ name: names[i], checks, errors, browser: " +
          (suite === "smoke" ? "browser" : "b") +
          ".version() });",
      );
      const file = resolve(scratch, suite + ".mjs");
      await writeFile(file, source);
      const code = await new Promise((resolve, reject) => {
        const child = spawn(process.execPath, [file], {
          stdio: "inherit",
          env: {
            ...process.env,
            SHOWCASE_FILTER: systems.map((system) => system.id).join(","),
            SHOWCASE_ARTIFACTS: artifacts + "/",
          },
        });
        child.on("error", reject);
        child.on("exit", resolve);
      });
      const results = JSON.parse(
        await readFile(resolve(artifacts, suite + ".json")),
      );
      receipt.suites.push({ suite, exitCode: code, results });
    }
  } catch (error) {
    failed = true;
    failure = error;
    throw error;
  } finally {
    try { await stop(); }
    catch (cleanupError) {
      if (failed) throw new AggregateError([failure, cleanupError], "Functional qualification and server cleanup failed");
      throw cleanupError;
    }
  }
  receipt.passed = receipt.suites.every(
    (s) =>
      s.exitCode === 0 &&
      s.results.every(
        (r) => r.checks.every((c) => c.pass) && !r.errors?.length,
      ),
  );
  await writeFile(
    reportPath,
    json(receipt),
    { flag: args.id ? "wx" : "w" },
  );
  if (!args.variant && engine === "chromium") {
    const current = JSON.parse(await readFile(inventoryPath));
    for (const system of systems)
      if (current.systems.find((entry) => entry.id === system.id)?.fingerprint !== receipt.fingerprints[system.id])
        throw new Error("Snapshot changed during functional qualification: " + system.id);
    const selectedIds = new Set(systems.map((system) => system.id));
    current.pendingSystems = [...new Set([
      ...(current.pendingSystems || (current.requiresFunctionalQualification
        ? current.systems.map((system) => system.id) : [])),
      ...(!receipt.passed ? [...selectedIds] : []),
    ])].filter((id) => !receipt.passed || !selectedIds.has(id));
    current.requiresFunctionalQualification = current.pendingSystems.length > 0;
    const qualification = {
      status: receipt.passed ? "passed" : "failed",
      at: receipt.at,
      receipt: "reports/functional-" + name + ".json",
      checksPassed: receipt.suites.reduce(
        (sum, suite) =>
          sum +
          suite.results.reduce(
            (sum, result) => sum + result.checks.filter((c) => c.pass).length,
            0,
          ),
        0,
      ),
    };
    current.systemQualifications ||= {};
    for (const id of selectedIds)
      current.systemQualifications[id] = { ...qualification, fingerprint: receipt.fingerprints[id] };
    current.qualification = {
      ...qualification,
      status: current.requiresFunctionalQualification ? "pending" : "passed",
      pendingSystems: current.pendingSystems,
      selectedSystems: [...selectedIds],
      note: "Selected-system receipt; previous panel qualification retained in qualificationHistory and unmodified frozen entries.",
    };
    await writeFile(inventoryPath, json(current));
  }
  if (!receipt.passed) process.exitCode = 1;
  return receipt;
}
