import { readFile, writeFile, mkdir, rm, copyFile } from "node:fs/promises";
import { resolve, dirname, relative, extname } from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { Marked } from "marked";

const project = fileURLToPath(new URL("..", import.meta.url));
const repo = resolve(project, "../..");
const source = resolve(repo, process.env.PERF_REPORT_SOURCE || "plans/native-showcase-performance-results.md");
// Derive measurement dates from immutable run timestamps before rendering.
if (!process.env.PERF_REPORT_SOURCE) {
  const { dateReportTables } = await import("../../performance/experiments/date-report-tables.mjs");
  await dateReportTables({ check: true });
}
const markdown = await readFile(source, "utf8");
const hash = (value) => createHash("sha256").update(value).digest("hex");
const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );
const slug = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
await rm(resolve(project, "public"), { recursive: true, force: true });
await mkdir(resolve(project, "public/documents"), { recursive: true });
const resources = new Map();
// Copy only explicit document links; the viewer never exposes the repository root.
for (const match of markdown.matchAll(/\]\(([^)]+)\)/g)) {
  const href = match[1];
  if (/^(https?:|#)/.test(href)) continue;
  const path = resolve(dirname(source), href);
  if (
    !path.startsWith(repo + "/") ||
    ![".md", ".json", ".txt"].includes(extname(path))
  )
    throw new Error(`Unsupported report link: ${href}`);
  const target = `documents/${relative(repo, path)}`;
  await mkdir(dirname(resolve(project, "public", target)), { recursive: true });
  await copyFile(path, resolve(project, "public", target));
  resources.set(href, `/${target}`);
}
await copyFile(source, resolve(project, "public/results.md"));
let section = "",
  subsection = "",
  tableIndex = 0;
const tables = [];
let comparison;
const headings = [];
const renderer = {
  heading(token) {
    const id = slug(token.text);
    if (token.depth === 2) {
      section = id;
      subsection = token.text;
      headings.push({ id, label: token.text });
    }
    if (token.depth === 3) subsection = token.text;
    return `<h${token.depth} id="${id}">${this.parser.parseInline(token.tokens)}</h${token.depth}>\n`;
  },
  html(token) {
    if (/^<!-- (BEGIN|END) (SECOND PASS|DOM REVIEW|WEB AWESOME|SPECTRUM GEN2|CALENDAR VARIANTS|EN REVE MAIN|EN REVE CURRENT OVERVIEW|EN REVE CURRENT DOM|LATEST MAIN|LATEST CALENDAR) -->\s*$/.test(token.text)) return "";
    return escape(token.text);
  },
  link(token) {
    const href = resources.get(token.href) ?? token.href;
    if (!/^(https?:|#|\/documents\/)/.test(href))
      return this.parser.parseInline(token.tokens);
    return `<a href="${escape(href)}">${this.parser.parseInline(token.tokens)}</a>`;
  },
  table(token) {
    const original = section === "first-reference-comparison";
    const id = original
      ? "reference-comparison"
      : `metric-table-${++tableIndex}`;
    const headers = token.header.map((cell) => cell.text);
    const rows = token.rows.map((row) => row.map((cell) => cell.text));
    const missing = (value) => value === "—" || value === "";
    const numeric = headers.map((_, index) =>
      rows.every(
        (row) =>
          missing(row[index]) || /^[-+]?\d[\d,]*(?:\.\d+)?$/.test(row[index]),
      ),
    );
    if (original) comparison = { headers, rows };
    tables.push({
      id,
      title: subsection,
      original,
      caption: original && !process.env.PERF_REPORT_SOURCE ? "First reference comparison · versioned acquisitions; consult Date and Run ID" : subsection,
      headers,
      rows,
      numeric,
      html: token.rows.map((row) =>
        row.map((cell) => this.parser.parseInline(cell.tokens)),
      ),
    });
    const cell = (c, tag, scope = "", index) =>
      `<${tag}${scope}${headers[index] === "Implementation" ? ' class="implementation-column"' : ""}>${this.parser.parseInline(c.tokens)}</${tag}>`;
    const table = `<div class="table-scroll" role="region" tabindex="0" aria-label="${escape(section.replaceAll("-", " "))} table"><table><thead><tr>${token.header.map((c, i) => cell(c, "th", ' scope="col"', i)).join("")}</tr></thead><tbody>${token.rows.map((row) => `<tr>${row.map((c, i) => cell(c, i ? "td" : "th", i ? "" : ' scope="row"', i)).join("")}</tr>`).join("")}</tbody></table></div>`;
    return `<div id="${id}" class="measurement-table" data-table-id="${id}"><p class="table-instruction">Select a column heading to sort; select again to reverse. Scroll horizontally for more columns. Missing measurements stay last.</p><div id="${original ? "comparison-fallback" : id + "-fallback"}" class="table-fallback">${table}</div><div id="${original ? "comparison-interactive" : id + "-interactive"}" class="table-interactive" hidden></div><div class="table-actions" ${original ? 'id="sort-actions"' : ""} hidden><p ${original ? 'id="sort-status"' : ""} role="status" aria-live="polite">Source order · ${rows.length} rows</p><en-button ${original ? 'id="reset-sort"' : ""} variant="ghost">Reset order</en-button><en-button class="export-table" variant="ghost">Download CSV</en-button></div></div>`;
  },
};
const content = new Marked({ renderer, gfm: true }).parse(markdown);
if (!comparison)
  throw new Error("Expected exactly one reference comparison table.");
await writeFile(
  resolve(project, "src/comparison.json"),
  JSON.stringify(comparison, null, 2) + "\n",
);
await writeFile(
  resolve(project, "src/tables.json"),
  JSON.stringify(tables, null, 2) + "\n",
);
const nav = headings
  .map(
    ({ id, label }, i) =>
      `<a href="#${id}"><span>${String(i + 1).padStart(2, "0")}</span>${escape(label)}</a>`,
  )
  .join("");
const sourceHash = hash(markdown);
await writeFile(
  resolve(project, "index.html"),
  `<!doctype html>
<html lang="en" style="color-scheme:light"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="description" content="En Reve native showcase performance evidence and engineering backlog, with grouped sortable measurements and a prioritized engineering backlog."><title>Performance results · En Reve</title></head>
<body><a class="skip-link" href="#content">Skip to results</a><header class="masthead"><a href="#" class="wordmark">En Rêve<span>Performance laboratory</span></a><a href="/results.md" download>Download source ↗</a></header>
<div class="page-layout"><aside><p class="eyebrow">Research / 01</p><h2>Results &amp;<br>engineering backlog</h2><nav aria-label="Report sections">${nav}</nav><p class="source-note">Exploratory evidence<br>Dated comparison cohorts</p></aside><main id="content"><div class="report-label"><en-badge>${process.env.PERF_REPORT_SOURCE ? "Campaign evidence" : "Exploratory baseline"}</en-badge><span>Native implementations · grouped measurements</span></div><article>${content}</article><footer>Rendered from the results document · Source <code>${sourceHash.slice(0, 12)}</code><br><a href="/results.md">Read the original Markdown</a></footer></main></div><script type="module" src="/src/main.js"></script></body></html>`,
);
const inputs = await Promise.all(
  [
    "src/main.js",
    "src/table-data.js",
    "src/styles.css",
    "src/sticky-columns.css",
    "scripts/render.mjs",
    "package-lock.json",
  ].map((name) => readFile(resolve(project, name))),
);
await writeFile(
  resolve(project, "public/source.json"),
  JSON.stringify(
    {
      source: relative(repo, source),
      sourceHash,
      buildHash: hash(Buffer.concat([Buffer.from(markdown), ...inputs])),
      resourceCount: resources.size,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  `Rendered full report, ${headings.length} sections, ${tables.length} sortable tables.`,
);
