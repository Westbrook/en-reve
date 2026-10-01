import { expect } from "@playwright/test";
export const version = 4;
export function adapter(page, id) {
  const card = (name) => page.locator("#showcase-" + name);
  // Web Awesome's public label supplies a visible heading, but 3.13.0 does not
  // name its internal native dialog. Preserve that vendor behavior in the fixture.
  const dialogHost = (title) => page.locator("wa-dialog,wa-drawer")
    .and(page.locator(`[label=${JSON.stringify(title)}]`));
  const role = (scope, kind, options = {}) => {
    if (id !== "fluent-web-components") return scope.getByRole(kind, options);
    const name = options.name;
    if (kind === "button")
      return scope.locator("fluent-button,fluent-menu-button").filter({
        hasText:
          typeof name === "string"
            ? new RegExp(
                "^\\s*" + name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s*$",
              )
            : name,
      });
    if (kind === "textbox")
      return scope
        .locator("fluent-field")
        .filter({ has: page.locator("label").filter({ hasText: name }) })
        .locator("input,textarea");
    return scope.getByRole(kind, options);
  };
  return {
    card,
    role,
    dialog: (title) => id === "web-awesome"
      ? dialogHost(title).filter({ has: page.getByRole("heading", { name: title, exact: true }) }).locator("dialog")
      : page.getByRole("dialog", { name: title, exact: true }),
    dialogScope: (title, dialog) => id === "web-awesome" ? dialogHost(title) : id === "fluent-web-components"
      ? page.locator("fluent-dialog,fluent-drawer").and(page.locator(`[aria-label=${JSON.stringify(title)}]`))
      : dialog,
    click: (name, label) =>
      role(card(name), "button", { name: label, exact: true }).first().click(),
  };
}
export async function qualify(page, id) {
  const { card, click } = adapter(page, id);
  await expect(page.locator(".showcase-card")).toHaveCount(16);
  await expect(
    page.locator(".site-header,.showcase-theme,#scope-gaps"),
  ).toHaveCount(0);
  await click("actions", "Landscape");
  await expect(card("asset").locator("[data-layout]").first()).toHaveAttribute(
    "data-layout",
    "landscape",
  );
  await click("actions", "Portrait");
  await expect(card("asset").locator("[data-layout]").first()).toHaveAttribute(
    "data-layout",
    "portrait",
  );
}
export async function measuredAction(page, name, spec, action, verify) {
  await page.evaluate(({ name, spec }) => window.__perf.arm(name, spec), {
    name,
    spec,
  });
  await action();
  await verify();
  await page.waitForFunction(
    () => window.__perf.state.actions.at(-1).completed,
    null,
    { timeout: 5000 },
  );
}
export async function journey(page, id, { repeats = 2, measure = true } = {}) {
  const { card, role, click, dialog: findDialog, dialogScope } = adapter(page, id);
  const run = async (name, spec, action, verify) =>
    measure
      ? measuredAction(page, name, spec, action, verify)
      : (await action(), await verify());
  for (let i = 0; i < repeats; i++) {
    for (const [label, layout] of [
      ["Landscape", "landscape"],
      ["Portrait", "portrait"],
    ]) {
      await run(
        `canvas-${layout}-${i ? "warm" : "first"}`,
        {
          target: "#showcase-asset [data-layout]",
          attribute: "data-layout",
          value: layout,
        },
        () => click("actions", label),
        () =>
          expect(
            card("asset").locator("[data-layout]").first(),
          ).toHaveAttribute("data-layout", layout),
      );
    }
    await run(
      `asset-add-${i ? "warm" : "first"}`,
      { target: "#showcase-library", text: "1 asset" },
      () => click("library", "Add a sample asset"),
      () => expect(card("library")).toContainText("1 asset"),
    );
    await run(
      `asset-reset-${i ? "warm" : "first"}`,
      { target: "#showcase-library", text: "No assets" },
      () => click("library", /^Reset/),
      () => expect(card("library")).toContainText("No assets"),
    );
    const dialog = findDialog("Start with a direction");
    await run(
      `dialog-open-${i ? "warm" : "first"}`,
      { dialogName: "Start with a direction" },
      () =>
        role(card("actions"), "button", { name: /^Create/ })
          .first()
          .click(),
      () => expect(dialog).toBeVisible(),
    );
    const scope = dialogScope("Start with a direction", dialog);
    await role(scope, "button", { name: "Close", exact: true }).first().click();
    await expect(dialog).not.toBeVisible();
    await expect(page.locator("dialog:modal")).toHaveCount(0);
    if (id === "spectrum-web-components") {
      await page.waitForFunction(() =>
        [...document.querySelectorAll("sp-overlay")].every(
          (overlay) => !overlay.open && overlay.state === "closed",
        ),
      );
      await page.evaluate(
        () =>
          new Promise((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(resolve)),
          ),
      );
    }
    // Settle native overlay exit animations before the next independent action.
    await page.evaluate(async () => {
      await Promise.allSettled(
        document
          .getAnimations()
          .filter(
            (a) =>
              a.playState === "running" &&
              a.effect?.getTiming().iterations !== Infinity,
          )
          .map((a) => a.finished),
      );
    });
  }
  const note = role(card("feedback"), "textbox", { name: /Review note/ });
  await note.fill("Performance review");
  await run(
    "review-submit",
    { target: "#showcase-feedback", text: "Performance review" },
    () => click("feedback", "Add review"),
    () => expect(card("feedback")).toContainText("4 / 5 — Performance review"),
  );
  {
    const commands = findDialog("Studio commands");
    await run(
      "commands-first",
      { dialogName: "Studio commands" },
      () => click("actions", "All commands"),
      () => expect(commands).toBeVisible(),
    );
    const scope = dialogScope("Studio commands", commands);
    await role(scope, "button", { name: "Close", exact: true }).first().click();
    await expect(commands).not.toBeVisible();
  }
  await page.evaluate(() => {
    window.scrollTo(0, 0);
  });
}
export async function scrollFrames(page) {
  return page.evaluate(async () => {
    const times = [],
      start = performance.now(),
      height = document.documentElement.scrollHeight - innerHeight;
    await new Promise((resolve) => {
      function frame(time) {
        times.push(time);
        const ratio = Math.min(1, (time - start) / 1500);
        scrollTo(0, height * (ratio <= 0.5 ? ratio * 2 : (1 - ratio) * 2));
        if (ratio < 1) requestAnimationFrame(frame);
        else resolve();
      }
      requestAnimationFrame(frame);
    });
    return {
      label:
        "rAF intervals during scripted scroll; not compositor presentation timestamps",
      intervals: times.slice(1).map((t, i) => t - times[i]),
    };
  });
}
