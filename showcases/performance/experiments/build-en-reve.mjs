import { writeExperimentReceipt } from './receipt-output.mjs';
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { root, showcases, json, sha } from "../src/config.mjs";
import { assetManifest } from "../src/prepare.mjs";
import { isolation } from "../../tools/isolation-plugin.mjs";
const project = resolve(showcases, "en-reve");
const { build } = await import(
  pathToFileURL(resolve(project, "node_modules/vite/dist/node/index.js"))
);
const scratch = resolve(project, ".performance");
await mkdir(scratch, { recursive: true });
const original = await readFile(resolve(project, "src/main.js"), "utf8");
const nativeEntry = original.replaceAll('"./', '"../src/');
const lazyLoader = `
const loadCommands = () => import('@en-reve/elements/define/command-palette.js');
let pendingCommands;
document.addEventListener('click', async event => {
  const trigger = event.composedPath().find(node => node?.id === 'showcase-palette-trigger');
  if (!trigger || customElements.get('en-command-palette')) return;
  event.preventDefault(); event.stopImmediatePropagation();
  try {
    pendingCommands ||= loadCommands(); await pendingCommands;
    await document.querySelector('en-command-palette')?.updateComplete;
    trigger.click();
  } catch (error) { pendingCommands = undefined; console.error('Command palette failed to load', error); }
}, true);
`;
const specs = [
  {
    id: "split-vendor",
    entry: nativeEntry,
    split: true,
    description:
      "Eager vendor/application chunks; isolates dependency caching without deferring capability.",
  },
  {
    id: "split-vendor-edit",
    entry: nativeEntry + '\ndocument.title = "En Reve showcase — copy edit";\n',
    split: true,
    description:
      "One application-only edit to test stable dependency chunk identity.",
  },
  {
    id: "lazy-commands",
    entry:
      nativeEntry.replace(
        'import "@en-reve/elements/define/command-palette.js";\n',
        "",
      ) + lazyLoader,
    description:
      "Load command-palette registration on its first activation; preserve all other eager definitions.",
  },
  {
    id: "intent-commands",
    entry:
      nativeEntry.replace(
        'import "@en-reve/elements/define/command-palette.js";\n',
        "",
      ) +
      lazyLoader +
      `\nfor (const type of ['pointerover','focusin']) document.addEventListener(type, event => { if (event.composedPath().some(node => node?.id === 'showcase-palette-trigger')) pendingCommands ||= loadCommands(); }, true);\n`,
    description:
      "Same dynamic boundary with pointer/focus intent preloading; cold keyboard activation remains supported.",
  },
  {
    id: "content-visibility",
    entry: nativeEntry + '\nimport "./containment.css";\n',
    description:
      "Browser-managed rendering containment after the first card in each showcase column; intrinsic size reserved. Still downloads and instantiates all components.",
  },
];
await writeFile(
  resolve(scratch, "containment.css"),
  ".showcase-column > .showcase-card:nth-child(n+2){content-visibility:auto;contain-intrinsic-size:auto 480px}\n",
);
const results = [];
const only = process.argv[2];
if (only && !specs.some((s) => s.id === only))
  throw new Error("Unknown experiment");
for (const spec of specs.filter((s) => !only || s.id === only)) {
  const entryPath = resolve(scratch, spec.id + ".js");
  await writeFile(entryPath, spec.entry);
  const outDir = resolve(root, ".cache/variants", spec.id);
  await build({
    root: project,
    configFile: false,
    logLevel: "warn",
    plugins: [
      isolation(project),
      {
        name: "performance-entry",
        transformIndexHtml: {
          order: "pre",
          handler: (html) =>
            html.replace("/src/main.js", "/.performance/" + spec.id + ".js"),
        },
      },
    ],
    build: {
      outDir,
      emptyOutDir: true,
      sourcemap: true,
      ...(spec.split
        ? {
            rolldownOptions: {
              output: {
                codeSplitting: {
                  groups: [
                    {
                      name: (id) =>
                        id.includes("node_modules") ? "vendor" : null,
                    },
                  ],
                },
              },
            },
          }
        : {}),
    },
  });
  const assets = await assetManifest(outDir);
  results.push({
    id: spec.id,
    description: spec.description,
    entrySha256: sha(spec.entry),
    assets,
    fingerprint: sha(json(assets.map((a) => [a.path, a.sha256]))),
    cohort: "supported-consumer-experiment",
    qualification:
      "Must pass functional and first-use checks before recommendation",
  });
  console.log(`Built experiment ${spec.id}`);
}
// Independent adoption costs use the same installed native packages and Vite production pipeline.
for (const [id, definitions] of Object.entries(
  only
    ? {}
    : {
        shell: [],
        button: ["button"],
        forms: ["button", "text-field", "checkbox", "select", "select-option"],
        overlays: ["dialog", "drawer", "command-palette"],
        date: ["date-picker"],
      },
)) {
  const entry =
    definitions
      .map((name) => `import '@en-reve/elements/define/${name}.js';`)
      .join("\n") + '\nimport "../src/theme.css";\nimport "../src/base.css";\n';
  const entryPath = resolve(scratch, "family-" + id + ".js");
  await writeFile(entryPath, entry);
  const outDir = resolve(root, ".cache/families", id);
  await build({
    root: project,
    configFile: false,
    logLevel: "warn",
    plugins: [
      isolation(project),
      {
        name: "performance-family",
        transformIndexHtml: {
          order: "pre",
          handler: (html) =>
            html.replace("/src/main.js", "/.performance/family-" + id + ".js"),
        },
      },
    ],
    build: { outDir, emptyOutDir: true, sourcemap: true },
  });
  results.push({
    id: "family-" + id,
    description:
      "Import-only delivery attribution; not an interactive full-showcase comparator.",
    assets: await assetManifest(outDir),
    cohort: "attribution",
  });
}
let previous = [];
try {
  previous = process.env.EN_NATIVE_EXPERIMENT_OUTPUT ? [] : JSON.parse(
    await readFile(resolve(root, "reports/en-reve-experiments.json")),
  );
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
await writeExperimentReceipt(
  "reports/en-reve-experiments.json",
  json([
    ...previous.filter((p) => !results.some((r) => r.id === p.id)),
    ...results,
  ]),
);
