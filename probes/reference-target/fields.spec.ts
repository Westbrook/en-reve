import { test, expect } from '@playwright/test';
const tags = ['text-field','textarea','number-field','date-input','search-input','time-field','select','combobox','color-field'];
for (const fallback of [false, true]) test(`all common fields preserve external-label relationships (${fallback ? 'fallback' : 'native-preferred'})`, async ({ page, browser }, info) => {
  info.annotations.push({type:'browser-version',description:browser.version()});
  await page.goto('/probes/reference-target/fields-fixture.html' + (fallback ? '?fallback' : ''));
  await expect(page.locator('body')).toHaveAttribute('data-ready','true');
  for (const tag of tags) {
    const host = page.locator(`#${tag}`);const input = host.locator('#control');
    await expect(input).toHaveCount(1);
    await expect.poll(() => input.evaluate((node: HTMLInputElement) => [...(node.ariaLabelledByElements ?? node.labels ?? [])].map(label => label.textContent?.trim()))).toEqual([`External ${tag}`, `Internal ${tag}`]);
    await page.locator(`#label-${tag}`).click();
    await expect(input).toBeFocused();
    await page.locator('#outside').click();
    await host.evaluate((host: any) => { host.disabled = true; });
    await expect(input).toBeDisabled();
    await page.locator(`#label-${tag}`).click();
    await expect(input).not.toBeFocused();
    await host.evaluate((host: any) => { host.disabled = false; });
    await expect(input).toBeEnabled();
    await page.locator(`#label-${tag}`).evaluate(label => { label.outerHTML = label.outerHTML.replace('External ', 'Replacement '); });
    await expect.poll(() => input.evaluate((node: HTMLInputElement) => [...(node.ariaLabelledByElements ?? node.labels ?? [])].map(label => label.textContent?.trim()))).toEqual([`Replacement ${tag}`, `Internal ${tag}`]);
  }
});

test('field label subscriptions share one observer and release the last subscriber', async ({ page }) => {
  await page.addInitScript(() => {
    const Native = MutationObserver;
    (window as any).labelObservers = { active: 0, starts: 0 };
    window.MutationObserver = class extends Native {
      private labelTree = false;
      override observe(target: Node, options: MutationObserverInit) {
        if (options.attributeFilter?.join(',') === 'id,for') {
          if (!this.labelTree) (window as any).labelObservers.active++;
          this.labelTree = true;(window as any).labelObservers.starts++;
        }
        super.observe(target, options);
      }
      override disconnect() { if (this.labelTree) (window as any).labelObservers.active--;this.labelTree = false;super.disconnect(); }
    };
  });
  await page.goto('/probes/reference-target/fields-fixture.html?fallback');
  await expect(page.locator('body')).toHaveAttribute('data-ready','true');
  expect(await page.evaluate(() => (window as any).labelObservers)).toEqual({active:1,starts:1});
  await page.locator('#fields').evaluate(form => form.remove());
  expect(await page.evaluate(() => (window as any).labelObservers)).toEqual({active:0,starts:1});
});
