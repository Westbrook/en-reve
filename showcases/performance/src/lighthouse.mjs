import { variantQualification } from './variant-qualification.mjs';
import lighthouse from "lighthouse";
import { launch } from "chrome-launcher";
import { chromium } from "@playwright/test";
import { mkdir, writeFile, appendFile, readFile, cp } from "node:fs/promises";
import { resolve } from "node:path";
import os from "node:os";
import {
  root,
  registry,
  profiles,
  rng,
  shuffle,
  json,
  sha,
} from "./config.mjs";
import { startServers } from "./server.mjs";
import { labIdentity } from "./runner.mjs";
export async function resolveLighthouseVariant(options, systems, labRoot = root) {
  if (!options.variant) return null;
  if (systems.length !== 1 || systems[0].id !== 'en-reve') throw new Error('Lighthouse variants require --systems en-reve');
  const variants = JSON.parse(await readFile(resolve(labRoot, 'reports/en-reve-experiments.json')));
  const variant = variants.find(v => v.id === options.variant);
  if (!variant) throw new Error('Unknown Lighthouse variant');
  const qualification = await variantQualification({root:labRoot, variant, functionalReceipt:options['functional-receipt']});
  return {variant, variantQualification:qualification.receipt, variantQualificationSource:qualification.source};
}
export async function runLighthouse(options) {
  const id =
    options.id ||
    new Date().toISOString().replace(/[:.]/g, "-") + "-lighthouse";
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) throw new Error("Use a simple run ID");
  const directory = resolve(root, "runs", id);
  await mkdir(directory, { recursive: true });
  const systems = options.systems
    ? registry.filter((s) => options.systems.split(",").includes(s.id))
    : registry;
  const count = Number(options.samples || 5),
    selected = (options.profiles || "desktop,mobile").split(",");
  if (options.caches && options.caches !== "cold")
    throw new Error("Lighthouse uses fresh cold-browser audits.");
  if (!Number.isInteger(count) || count < 1)
    throw new Error("Positive integer samples required");
  if (
    !systems.length ||
    options.systems?.split(",").some((id) => !registry.some((s) => s.id === id))
  )
    throw new Error("Unknown or empty system selection");
  if (selected.some((name) => !profiles[name]))
    throw new Error("Unknown profile");
  const selectedVariant = await resolveLighthouseVariant(options, systems);
  const inventory = JSON.parse(
    await readFile(resolve(root, ".cache/inventory.json")),
  );
  if (inventory.requiresFunctionalQualification)
    throw new Error("Qualify candidate artifacts before Lighthouse");
  for (const system of systems)
    for (const asset of (selectedVariant?.variant || inventory.systems.find((s) => s.id === system.id)).assets) {
      if (
        sha(
          await readFile(
            resolve(root, selectedVariant ? ".cache/variants" : ".cache/snapshots", selectedVariant?.variant.id || system.id, asset.path),
          ),
        ) !== asset.sha256
      )
        throw new Error(
          `Artifact changed after preparation: ${system.id}/${asset.path}`,
        );
    }
  const random = rng(Number(options.seed || 20260920)),
    jobs = [];
  let index = 0;
  for (let block = 0; block < count; block++)
    for (const job of shuffle(
      systems.flatMap((s) =>
        selected.map((profile) => ({
          system: s.id,
          ...(selectedVariant ? {variant:selectedVariant.variant.id} : {}),
          profile,
          cache: "cold",
          block,
        })),
      ),
      random,
    ))
      jobs.push({ ...job, id: String(++index).padStart(5, "0") });
  await writeFile(
    resolve(directory, "manifest.json"),
    json({
      schema: 1,
      id,
      options,
      jobs,
      createdAt: new Date().toISOString(),
      harnessSha256: await labIdentity(),
      inventory,
      ...selectedVariant,
      profiles,
      host: {
        cpu: os.cpus()[0]?.model,
        platform: os.platform(),
        release: os.release(),
      },
      methodology:
        "Lighthouse devtools throttling only; no external CDP throttling. Fresh Chrome per audit. Separate diagnostic cohort, never combined with primary samples.",
    }),
    { flag: "wx" },
  );
  for (const folder of ["src", "scenarios", "profiles", "registry"])
    await cp(resolve(root, folder), resolve(directory, "harness", folder), {
      recursive: true,
    });
  for (const file of ["package.json", "package-lock.json"])
    await cp(resolve(root, file), resolve(directory, "harness", file));
  const stop = await startServers({ systems, variant:options.variant });
  try {
    for (const job of jobs) {
      let chrome;
      const profile = profiles[job.profile],
        system = registry.find((s) => s.id === job.system),
        sample = {
          ...job,
          suite: "lighthouse",
          status: "running",
          errors: [],
          startedAt: new Date().toISOString(),
        };
      try {
        chrome = await launch({
          chromePath: chromium.executablePath(),
          chromeFlags: [
            "--headless",
            "--ignore-certificate-errors",
            "--no-first-run",
          ],
        });
        const result = await lighthouse(`https://127.0.0.1:${system.port}/`, {
          port: chrome.port,
          logLevel: "error",
          output: ["json", "html"],
          onlyCategories: ["performance"],
          formFactor: job.profile === "mobile" ? "mobile" : "desktop",
          screenEmulation: {
            mobile: job.profile === "mobile",
            width: profile.viewport.width,
            height: profile.viewport.height,
            deviceScaleFactor: 1,
            disabled: false,
          },
          throttlingMethod: "devtools",
          throttling: {
            cpuSlowdownMultiplier: profile.cpuRate,
            requestLatencyMs: profile.latency,
            downloadThroughputKbps:
              profile.download < 0 ? 0 : (profile.download * 8) / 1000,
            uploadThroughputKbps:
              profile.upload < 0 ? 0 : (profile.upload * 8) / 1000,
          },
          maxWaitForLoad: 30000,
        });
        await writeFile(
          resolve(directory, job.id + "-lighthouse.json"),
          result.report[0],
        );
        await writeFile(
          resolve(directory, job.id + "-lighthouse.html"),
          result.report[1],
        );
        const a = result.lhr.audits;
        sample.lighthouse = {
          fcp: a["first-contentful-paint"]?.numericValue,
          lcp: a["largest-contentful-paint"]?.numericValue,
          cls: a["cumulative-layout-shift"]?.numericValue,
          tbt: a["total-blocking-time"]?.numericValue,
          speedIndex: a["speed-index"]?.numericValue,
          score: result.lhr.categories.performance.score,
        };
        sample.browser = result.lhr.environment.hostUserAgent;
        sample.warnings = result.lhr.runWarnings;
        if (result.lhr.runtimeError)
          throw new Error(JSON.stringify(result.lhr.runtimeError));
        sample.metrics = sample.lighthouse;
        sample.status = "ok";
      } catch (error) {
        sample.status = "failed";
        sample.errors.push({ message: error.stack });
      } finally {
        await chrome?.kill();
      }
      await appendFile(
        resolve(directory, "samples.jsonl"),
        JSON.stringify(sample) + "\n",
      );
      console.log(
        `${job.id}/${jobs.length} ${job.system} ${job.profile} ${sample.status}`,
      );
    }
  } finally {
    await stop();
  }
  return directory;
}
