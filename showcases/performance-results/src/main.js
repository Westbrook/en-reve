import "@en-reve/tokens/default.css";
import "@en-reve/elements/define/data-table.js";
import "@en-reve/elements/define/badge.js";
import { unsafeHTML } from "lit/directives/unsafe-html.js";
import "./styles.css";
import "./sticky-columns.css";
import stickyColumnStyles from "./sticky-columns.css?inline";
import tables from "./tables.json";
import { compareValues, csvCell } from "./table-data.js";

const collator = new Intl.Collator("en", { sensitivity: "base" });
const stickyColumnSheet = new CSSStyleSheet();
stickyColumnSheet.replaceSync(stickyColumnStyles);
for (const definition of tables) {
  const wrapper = document.getElementById(definition.id);
  const table = document.createElement("en-data-table");
  table.id = definition.original ? "results-table" : definition.id + "-native";
  table.label = definition.title;
  table.caption = definition.caption || definition.title;
  table.mode = "all";
  table.sticky = "header";
  const widths = definition.headers.map((label, index) =>
    definition.numeric[index]
      ? Math.max(
          9,
          Math.ceil(
            Math.max(...label.split(/\s+/).map((word) => word.length)) * 0.6 +
              5,
          ),
        )
      : index === 0
        ? 15
        : 20,
  );
  table.style.setProperty(
    "--en-data-table-min-inline-size",
    `${Math.max(
      48,
      widths.reduce((sum, width) => sum + width, 0),
    )}rem`,
  );
  table.style.setProperty(
    "--en-data-table-viewport-size",
    definition.rows.length > 16 ? "36rem" : "none",
  );
  table.items = definition.rows.map((cells, index) => ({
    id: String(index),
    cells,
    html: definition.html[index],
  }));
  table.getKey = (item) => item.id;
  table.columns = definition.headers.map((label, index) => ({
    key: String(index),
    label,
    className: label === "Implementation" ? "implementation-column" : undefined,
    rowHeader: index === 0,
    width: label === "Implementation" ? "clamp(9rem, 30vw, 15rem)" : `${widths[index]}rem`,
    compare: (a, b) =>
      compareValues(
        a.cells[index],
        b.cells[index],
        definition.numeric[index],
        table.sort?.direction,
        collator,
      ),
    // HTML is rendered at build time from repository Markdown: raw HTML is escaped,
    // and links are restricted to http(s), fragments and copied evidence documents.
    renderCell: (item) =>
      unsafeHTML(
        index === 0 && item.cells[index] === "En Reve"
          ? "<strong>" + item.html[index] + "</strong>"
          : item.html[index],
      ),
  }));
  const container = wrapper.querySelector(".table-interactive");
  container.append(table);
  await table.updateComplete;
  table.shadowRoot.adoptedStyleSheets = [
    ...table.shadowRoot.adoptedStyleSheets,
    stickyColumnSheet,
  ];
  wrapper.querySelector(".table-fallback").hidden = true;
  container.hidden = false;
  wrapper.querySelector(".table-actions").hidden = false;
  const status = wrapper.querySelector('[role="status"]');
  table.addEventListener("en-sort", async () => {
    await table.updateComplete;
    const sort = table.sort;
    if (sort)
      status.textContent = `${definition.headers[Number(sort.column)]} · ${sort.direction} · ${table.items.length} rows`;
  });
  wrapper
    .querySelector(".table-actions en-button")
    .addEventListener("click", () => {
      table.sort = undefined;
      status.textContent = `Source order · ${table.items.length} rows`;
    });
  wrapper.querySelector(".export-table").addEventListener("click", () => {
    const rows = [...table.items];
    if (table.sort) {
      const index = Number(table.sort.column);
      const direction = table.sort.direction;
      rows.sort(
        (a, b) =>
          compareValues(
            a.cells[index],
            b.cells[index],
            definition.numeric[index],
            direction,
            collator,
          ) * (direction === "descending" ? -1 : 1),
      );
    }
    const csv = [definition.headers, ...rows.map((row) => row.cells)]
      .map((row) => row.map(csvCell).join(","))
      .join("\r\n");
    const url = URL.createObjectURL(
      new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download =
      definition.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") + ".csv";
    link.hidden = true;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
}
if (new URLSearchParams(location.search).has("progress-report")) {
  const link = document.createElement("a");
  link.className = "progress-return";
  link.href = "http://127.0.0.1:4177";
  link.textContent = "Progress Report";
  document.body.append(link);
}
