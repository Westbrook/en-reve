import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
const source = readFileSync(
  new URL(
    "../../../plans/native-showcase-performance-results.md",
    import.meta.url,
  ),
  "utf8",
);
const comparison = JSON.parse(
  readFileSync(new URL("../src/comparison.json", import.meta.url), "utf8"),
);
// Independent expected row orders, including stable ties across acquisitions.
const expectedOrder = (index, descending = false) => [...comparison.rows].sort((a,b) => {
  const av=a[index].replaceAll(',', ''), bv=b[index].replaceAll(',', '');
  const delta=Number.isFinite(Number(av)) && Number.isFinite(Number(bv)) ? Number(av)-Number(bv) : av.localeCompare(bv,'en',{sensitivity:'base'});
  return descending ? -delta : delta;
}).map(row=>row[0]);

test("all columns sort in both directions using the native En Reve table", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  const table = page.locator("#results-table");
  await expect(table.locator("tbody tr")).toHaveCount(comparison.rows.length);
  await expect(table.locator("tbody tr").first()).toHaveText(/En Reve/);
  for (let index = 0; index < comparison.headers.length; index++) {
    const header = table.locator("thead th").nth(index);
    await header.getByRole("button").click();
    await expect(header).toHaveAttribute("aria-sort", "ascending");
    await expect(table.locator("tbody th")).toHaveText(expectedOrder(index));
    await expect(page.locator("#sort-status")).toContainText("ascending");
    await header.getByRole("button").click();
    await expect(header).toHaveAttribute("aria-sort", "descending");
    await expect(table.locator("tbody th")).toHaveText(
      expectedOrder(index,true),
    );
    await expect(table.locator("[aria-sort]")).toHaveCount(1);
  }
  await page
    .locator("#reset-sort")
    .getByRole("button", { name: "Reset order", exact: true })
    .click();
  await expect(table.locator("tbody th")).toHaveText(
    comparison.rows.map((row) => row[0]),
  );
  await expect(table.locator("[aria-sort]")).toHaveCount(0);
  const keyboardButton = table.locator("thead th").nth(4).getByRole("button");
  await keyboardButton.focus();
  await page.keyboard.press("Enter");
  await expect(table.locator("tbody th")).toHaveText(expectedOrder(4));
  await expect(keyboardButton).toBeFocused();
  await page.keyboard.press("Space");
  await expect(table.locator("tbody th")).toHaveText(
    expectedOrder(4,true),
  );
  expect(errors).toEqual([]);
});
test("full report, evidence links, narrow viewport, and progress return", async ({
  page,
  request,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/?progress-report#first-reference-comparison");
  await expect(page.locator("#results-table tbody tr")).toHaveCount(comparison.rows.length);
  const headings = [...source.matchAll(/^## (.+)$/gm)].map((m) => m[1]);
  await expect(page.locator("article h2")).toHaveText(headings);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const overflow = await page.locator("#results-table").evaluate((el) => ({
    width: el.scrollElement.clientWidth,
    total: el.scrollElement.scrollWidth,
  }));
  expect(overflow.total).toBeGreaterThan(overflow.width);
  await expect(
    page.getByRole("link", { name: "Progress Report", exact: true }),
  ).toHaveAttribute("href", "http://127.0.0.1:4177");
  for (const link of await page
    .locator('article a[href^="/documents/"]')
    .evaluateAll((nodes) => nodes.map((n) => n.getAttribute("href"))))
    expect((await request.get(link)).status()).toBe(200);
  expect(await (await request.get("/results.md")).text()).toBe(source);
  await page.goto("/");
  await expect(page.locator("#results-table tbody tr")).toHaveCount(comparison.rows.length);
  await expect(
    page.getByRole("link", { name: "Progress Report", exact: true }),
  ).toHaveCount(0);
  await page.emulateMedia({ media: "print" });
  await expect(page.locator("#comparison-fallback")).toBeVisible();
  await expect(page.locator("#comparison-interactive")).toBeHidden();
  await expect(page.locator(".table-fallback").last()).toBeVisible();
  await expect(page.locator(".table-interactive").last()).toBeHidden();
});
test("all source rows remain readable without JavaScript", async ({
  browser, baseURL,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(baseURL);
  await expect(page.locator("#comparison-fallback tbody tr")).toHaveCount(comparison.rows.length);
  await expect(page.locator("#comparison-fallback")).toBeVisible();
  await expect(page.locator("#comparison-interactive")).toBeHidden();
  const definitions = JSON.parse(
    readFileSync(new URL("../src/tables.json", import.meta.url), "utf8"),
  );
  await expect(page.locator(".table-fallback")).toHaveCount(definitions.length);
  for (const definition of definitions)
    await expect(
      page.locator(
        `[data-table-id="${definition.id}"] .table-fallback tbody tr`,
      ),
    ).toHaveCount(definition.rows.length);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => [...document.querySelectorAll(".table-fallback .table-scroll")].every((viewport) => {
    viewport.scrollLeft = viewport.scrollWidth;
    const left = viewport.getBoundingClientRect().left + viewport.clientLeft;
    return [...viewport.querySelectorAll(".implementation-column")].every((cell) => Math.abs(cell.getBoundingClientRect().left - left) <= 2);
  }))).toBe(true);
  await context.close();
});
