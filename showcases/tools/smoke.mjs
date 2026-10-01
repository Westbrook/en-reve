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
const browser = await chromium.launch({ headless: true });
const results = [];
await mkdir(artifacts, { recursive: true });
for (let i = 0; i < names.length; i++) {
  if (
    process.env.SHOWCASE_FILTER &&
    !process.env.SHOWCASE_FILTER.split(",").includes(names[i])
  )
    continue;
  const page = await browser.newPage({
    viewport: { width: 1500, height: 1100 },
  });
  page.setDefaultTimeout(3500);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const checks = [];
  await page.goto("http://127.0.0.1:" + (4510 + i));
  await page.locator(".showcase-card").last().waitFor();
  const card = (id) => page.locator("#showcase-" + id);
  const click = (id, name) =>
    role(card(id), "button", { name, exact: true }).first().click();
  const role = (scope, kind, options = {}) => {
    if (names[i] !== "fluent-web-components")
      return scope.getByRole(kind, options);
    const name = options.name;
    if (kind === "button")
      return scope
        .locator("fluent-button,fluent-menu-button")
        .filter({
          hasText:
            typeof name === "string"
              ? new RegExp(
                  "^\\s*" +
                    name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") +
                    "\\s*$",
                )
              : name,
        });
    if (kind === "checkbox" || kind === "radio" || kind === "slider")
      return scope
        .locator("fluent-" + kind)
        .and(
          page.locator(
            '[aria-label="' +
              (typeof name === "string" ? name : name.source) +
              '"]',
          ),
        );
    if (kind === "textbox")
      return scope
        .locator("fluent-field")
        .filter({ has: page.locator("label").filter({ hasText: name }) })
        .locator("input,textarea");
    return scope.getByRole(kind, options);
  };
  const dialogHost = (title) => page.locator("wa-dialog,wa-drawer")
    .and(page.locator(`[label=${JSON.stringify(title)}]`));
  const findDialog = (title) => names[i] === "web-awesome"
    ? dialogHost(title).filter({ has: page.getByRole("heading", { name: title, exact: true }) }).locator("dialog")
    : page.getByRole("dialog", { name: title, exact: true });
  const dismiss = async (title) => {
    const dialog = findDialog(title);
    const scope =
      names[i] === "web-awesome" ? dialogHost(title) : names[i] === "fluent-web-components"
        ? page
            .locator("fluent-dialog,fluent-drawer")
            .and(page.locator('[aria-label="' + title + '"]'))
        : dialog;
    await role(scope, "button", { name: "Close", exact: true }).first().click();
    await expect(dialog).not.toBeVisible();
  };
  const test = async (name, fn) => {
    try {
      await fn();
      checks.push({ name, pass: true });
    } catch (e) {
      checks.push({ name, pass: false, error: e.message.slice(0, 850) });
      await page.keyboard.press("Escape");
    }
  };
  await test("sixteen cards; no docs/theme controls", async () => {
    await expect(page.locator(".showcase-card")).toHaveCount(16);
    await expect(
      page.locator(".site-header,.showcase-theme,#scope-gaps"),
    ).toHaveCount(0);
  });
  if (names[i] === "web-awesome") await test("native brief activation on first viewport exposure and tab return", async () => {
    await card("brief").scrollIntoViewIfNeeded();
    await expect(card("brief").getByText("A quieter workspace for a brighter idea. Start with a strong shape, an honest headline, and room to breathe.", { exact: true })).toBeVisible();
    await expect(role(card("brief"), "checkbox", { name: "Keep the headline editable", exact: true })).toBeChecked();
    await role(card("brief"), "tab", { name: "Delivery", exact: true }).click();
    await expect(role(card("brief"), "radio", { name: "Final artwork", exact: true })).toBeVisible();
    await role(card("brief"), "tab", { name: "The idea", exact: true }).click();
    await expect(role(card("brief"), "checkbox", { name: "Keep the headline editable", exact: true })).toBeVisible();
  });
  await test("canvas changes artwork", async () => {
    await click("actions", "Landscape");
    await expect(
      card("asset").locator("[data-layout]").first(),
    ).toHaveAttribute("data-layout", "landscape");
  });
  await test("create dialog", async () => {
    await role(card("actions"), "button", { name: /^Create/ })
      .first()
      .click();
    await expect(
      findDialog("Start with a direction"),
    ).toBeVisible();
    await dismiss("Start with a direction");
  });
  await test("preview dialog", async () => {
    await click("asset", "Preview study");
    await expect(
      findDialog("Shape & space"),
    ).toBeVisible();
    await role(page, "button", {
      name: "Back to the studio",
      exact: true,
    }).click();
    await expect(
      findDialog("Shape & space"),
    ).not.toBeVisible();
  });
  await test("commands dialog", async () => {
    await click("actions", "All commands");
    await expect(
      findDialog("Studio commands"),
    ).toBeVisible();
    await dismiss("Studio commands");
  });
  await test("native action menu", async () => {
    await role(card("actions"), "button", { name: /^Actions/ })
      .first()
      .click();
    await page
      .getByRole("menuitem", { name: "Portrait canvas", exact: true })
      .first()
      .click();
    await expect(
      card("asset").locator("[data-layout]").first(),
    ).toHaveAttribute("data-layout", "portrait");
  });
  await test("brief tabs", async () => {
    await role(card("brief"), "tab", { name: "Delivery", exact: true }).click();
    await expect(
      role(card("brief"), "radio", { name: "Final artwork" }),
    ).toBeVisible();
  });
  await test("checklist enables approval", async () => {
    await role(card("readiness"), "checkbox", {
      name: "Keyboard review complete",
      exact: true,
    })
      .first()
      .press("Space");
    await role(card("readiness"), "checkbox", {
      name: "Alternative text checked",
      exact: true,
    })
      .first()
      .press("Space");
    await click("readiness", "Approve study");
    await role(page, "button", {
      name: "Confirm approval",
      exact: true,
    }).click();
    await expect(card("readiness")).toContainText("Approved");
    await expect(page.locator("dialog:modal")).toHaveCount(0);
  });
  await test("project creation", async () => {
    await role(card("project"), "textbox", { name: /Project name/ })
      .first()
      .fill("Field study");
    await click("project", "Create project");
    await expect(card("project")).toContainText("Field study created locally.");
  });
  await test("output slider updates art", async () => {
    const slider = role(card("output"), "slider", {
      name: /Artwork opacity/,
    }).first();
    await slider.focus();
    await slider.press("ArrowRight");
    await expect(card("output")).toContainText("83%");
  });
  await test("export overlay", async () => {
    await click("output", "More export options");
    await expect(
      findDialog("Export options"),
    ).toBeVisible();
    await role(page, "button", { name: "Done", exact: true }).first().click();
    await expect(
      findDialog("Export options"),
    ).not.toBeVisible();
    await expect(page.locator("dialog:modal")).toHaveCount(0);
  });
  await test("review submission", async () => {
    await role(card("feedback"), "textbox", { name: /Review note/ }).fill(
      "Clear composition",
    );
    await expect(
      role(card("feedback"), "textbox", { name: /Review note/ }),
    ).toHaveValue("Clear composition");
    await click("feedback", "Add review");
    await expect(card("feedback")).toContainText("4 / 5 — Clear composition");
  });
  await test("notification save", async () => {
    await click("notifications", "Save preferences");
    await expect(card("notifications")).toContainText(
      "Saved locally: mentions, reviews.",
    );
  });
  await test("chat response", async () => {
    await role(card("chat"), "textbox", { name: "Message", exact: true }).fill(
      "A new idea",
    );
    await role(card("chat"), "button", { name: /^Send/ }).first().click();
    await expect(card("chat")).toContainText("Try a portrait composition");
  });
  await test("empty collection and reset", async () => {
    await click("library", "Add a sample asset");
    await expect(card("library")).toContainText("1 asset");
    await role(card("library"), "button", { name: /^Reset/ }).click();
    await expect(card("library")).toContainText("No assets yet");
  });
  await test("reset preserves another card", async () => {
    await role(card("actions"), "textbox", {
      name: "Study name",
      exact: true,
    }).fill("Keep this");
    await role(card("project"), "button", { name: /^Reset/ }).click();
    await expect(
      role(card("actions"), "textbox", { name: "Study name", exact: true }),
    ).toHaveValue("Keep this");
  });
  await test("390px reflow", async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
      .toBeLessThanOrEqual(390);
  });
  await page.screenshot({
    path: new URL(names[i] + "-mobile.png", artifacts)
      .pathname,
    fullPage: true,
  });
  await test("progress return only when flagged", async () => {
    await expect(page.locator(".progress-return")).toHaveCount(0);
    await page.goto("http://127.0.0.1:" + (4510 + i) + "/?progress-report");
    await expect(
      page.getByRole("link", { name: "Progress Report", exact: true }),
    ).toHaveAttribute("href", "http://127.0.0.1:4177");
  });
  results.push({ name: names[i], checks, errors });
  if (names[i] === "web-awesome") results.at(-1).vendorLimitations = [
    "Web Awesome 3.13.0 renders the public dialog/drawer label as a heading but does not give the internal native dialog an accessible name. Qualification identifies the public host label, visible heading and native dialog; it does not repair vendor internals or certify accessible naming.",
  ];
  console.log(JSON.stringify(results.at(-1)));
  await page.close();
}
await browser.close();
await writeFile(
  new URL("smoke.json", artifacts),
  JSON.stringify(results, null, 2),
);
if (results.some((r) => r.errors.length || r.checks.some((c) => !c.pass)))
  process.exitCode = 1;
