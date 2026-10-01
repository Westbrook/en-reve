import { test, expect } from "@playwright/test";
import { tables, sortGroups, sortTitle, coverageFor, coverageDigest, sortFailures } from '../scripts/sort-coverage.mjs';

test.describe('exhaustive numeric sorting', () => {
  test.describe.configure({ mode: 'parallel' });
  for (const group of sortGroups) test(sortTitle(group), async ({ page }, info) => {
    test.setTimeout(Math.min(600000, Math.max(180000, group.weight * 600)));
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/?progress-report#second-pass-measurements');
    await expect(page.locator('en-data-table')).toHaveCount(tables.length);
    const covered = [];
    for (const definition of group.tables) {
      const table = page.locator(`[data-table-id="${definition.id}"] en-data-table`);
      await expect(table.locator('tbody tr')).toHaveCount(definition.rows.length);
      for (let index = 0; index < definition.headers.length; index++) {
        if (!definition.numeric[index]) continue;
        for (const direction of ['ascending', 'descending']) {
          // Trusted input remains one real Playwright click for every required facet.
          await table.locator('thead th').nth(index).getByRole('button').click();
          await expect.poll(async () => {
            const observation = await table.evaluate((element, column) => {
              const surface = element.shadowRoot ?? element;
              return ({
              direction: surface.querySelectorAll('thead th')[column].getAttribute('aria-sort'),
              markers: surface.querySelectorAll('[aria-sort]').length,
              texts: [...surface.querySelectorAll('tbody tr')].map(row => row.children[column].textContent.trim()),
            }); }, index);
            return sortFailures(observation, { direction, rows: definition.rows.length });
          }, { message: `${definition.id}: ${definition.headers[index]} ${direction}` }).toEqual([]);
          covered.push({ table: definition.id, column: index, header: definition.headers[index], direction, rows: definition.rows.length });
        }
      }
    }
    expect(errors).toEqual([]);
    expect(covered).toEqual(coverageFor(group));
    info.annotations.push({ type: 'sort-coverage-sha256', description: coverageDigest(group) });
    await info.attach('sort-coverage', { body: JSON.stringify({ project: info.project.name, facets: covered }), contentType: 'application/json' });
  });
});
test("CSV exports the current comparison order and report remains within a mobile viewport", async ({
  page,
}) => {
  await page.goto("/#first-reference-comparison");
  const wrapper = page.locator("#reference-comparison");
  const table = wrapper.locator("en-data-table");
  await table.locator("thead th").nth(4).getByRole("button").click();
  const downloadPromise = page.waitForEvent("download");
  await wrapper
    .getByRole("button", { name: "Download CSV", exact: true })
    .click();
  const download = await downloadPromise;
  const stream = await download.createReadStream();
  let text = "";
  for await (const chunk of stream) text += chunk.toString();
  expect(text).toContain('"Median LCP ms"');
  expect(text.split("\r\n")[1]).toMatch(/^"Fluent Web Components",/);
  expect(text).toContain('"1,380"');
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const allTables = page.locator("en-data-table");
  await expect(allTables).toHaveCount(tables.length);
  // Keep every table/row assertion; batch only browser transport and readiness.
  const geometry = await allTables.evaluateAll(async elements => {
    await Promise.all(elements.map(element => element.updateComplete));
    return elements.map(element => {
      const viewport = element.scrollElement;
      const bounds = {
        host: element.getBoundingClientRect().width,
        viewport: innerWidth,
        scroll: viewport.scrollWidth,
        client: viewport.clientWidth,
      };
      viewport.scrollLeft = viewport.scrollWidth;
      const left = viewport.getBoundingClientRect().left;
      const pinned = [...element.shadowRoot.querySelectorAll("th.implementation-column, td.implementation-column")]
        .every(cell => Math.abs(cell.getBoundingClientRect().left - left) <= 2);
      return { ...bounds, pinned };
    });
  });
  expect(geometry).toHaveLength(tables.length);
  for (const bounds of geometry) {
    expect(bounds.host).toBeLessThanOrEqual(bounds.viewport);
    expect(bounds.scroll).toBeGreaterThanOrEqual(bounds.client);
    expect(bounds.pinned).toBe(true);
  }
});
