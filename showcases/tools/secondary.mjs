import { chromium, expect } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
const artifacts = new URL(process.env.SHOWCASE_ARTIFACTS || "../artifacts/", import.meta.url);
const names = [
  "radix-react",
  "fluent-react",
  "spectrum-react",
  "astryx-react",
  "shadcn-react",
  "fluent-web-components",
  "spectrum-web-components",
  "en-reve",
  "web-awesome",
];
const b = await chromium.launch();
const results = [];
await mkdir(artifacts, { recursive: true });
for (let i = 0; i < names.length; i++) {
  if (
    process.env.SHOWCASE_FILTER &&
    !process.env.SHOWCASE_FILTER.split(",").includes(names[i])
  )
    continue;
  const p = await b.newPage({ viewport: { width: 1500, height: 1100 } });
  p.setDefaultTimeout(4000);
  const errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("http://127.0.0.1:" + (4510 + i));
  await p.locator(".showcase-card").last().waitFor();
  const card = (id) => p.locator("#showcase-" + id);
  const checks = [];
  const run = async (name, fn) => {
    try {
      await fn();
      checks.push({ name, pass: true });
    } catch (e) {
      checks.push({ name, pass: false, error: e.message.slice(0, 700) });
      await p.keyboard.press("Escape");
    }
  };
  await run("activity period updates data", async () => {
    const c = card("activity");
    if (i === 5) {
      await c.locator("fluent-dropdown").click();
      await p.locator('fluent-option[value="Six months"]').click();
    } else if (i === 6 || names[i] === "web-awesome") {
      await c.getByRole("radio", { name: "Six months" }).click();
    } else {
      await c
        .getByRole(
          i === 1 || i === 4 ? "tab" : i === 7 || i === 3 ? "radio" : "radio",
          { name: "Six months", exact: true },
        )
        .first()
        .press("Space");
    }
    await expect(c).toContainText("600");
  });
  await run("teammate invitation", async () => {
    const c = card("team");
    if (i === 0) {
      await c
        .getByRole("combobox", { name: "Add a teammate" })
        .fill("Ada Lovelace");
    } else if (i === 3) {
      await c
        .getByRole("button", { name: "Add a teammate", exact: true })
        .click();
      await p.getByRole("option", { name: /Ada Lovelace/ }).click();
    } else if (i === 5) {
      await c.locator("#person input").fill("Ada");
      await p.locator('fluent-option[value="Ada Lovelace"]').click();
    } else if (names[i] === "web-awesome") {
      await c.getByRole("combobox", { name: /Add a teammate/ }).click();
      await p.getByRole("option", { name: "Ada Lovelace", exact: true }).click();
    } else {
      const combo = c.getByRole("combobox", { name: /Add a teammate/ }).first();
      await combo.click();
      await combo.fill("Ada");
      await p
        .getByRole("option", { name: "Ada Lovelace", exact: true })
        // Gen1 Spectrum can retain an unrendered authored option while its
        // popup presents another option; WebKit exposes both to role queries.
        .filter({ visible: true })
        .first()
        .click();
    }
    if (i === 5) await c.locator("[data-action=invite]").click();
    else
      await c
        .getByRole("button", { name: "Add to demo team", exact: true })
        .click();
    await expect(
      c.locator("li").filter({ hasText: "Ada Lovelace" }),
    ).toHaveCount(1);
  });
  await run("study popover", async () => {
    const c = card("asset");
    if (i === 5)
      await c
        .locator("fluent-button")
        .filter({ hasText: "About this study" })
        .click();
    else
      await c
        .getByRole("button", { name: "About this study", exact: true })
        .first()
        .click();
    await expect(
      p
        .getByText(
          "This editable composition uses the active theme’s colors.",
          { exact: false },
        )
        .first(),
    ).toBeVisible();
    await p.keyboard.press("Escape");
  });
  await run("tablet two columns", async () => {
    await p.setViewportSize({ width: 900, height: 1000 });
    await expect
      .poll(() =>
        p
          .locator(".showcase-grid")
          .evaluate(
            (e) => getComputedStyle(e).gridTemplateColumns.split(" ").length,
          ),
      )
      .toBe(2);
  });
  results.push({ name: names[i], checks, errors });
  console.log(JSON.stringify(results.at(-1)));
  await p.close();
}
await b.close();
await writeFile(
  new URL("secondary.json", artifacts),
  JSON.stringify(results, null, 2),
);
if (results.some((r) => r.errors.length || r.checks.some((c) => !c.pass)))
  process.exitCode = 1;
