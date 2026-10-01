import {test, expect, type Page} from '@playwright/test';

type Harness = {tooltipContextHarness: {provide(target: string | HTMLElement, id: string | null): void}};
const tip = (page: Page, name: string) => page.locator(`body > #tip-${name}`);
const trigger = (page: Page, name: string) => page.locator(`body > .group #${name}`);
async function tick(page: Page, ms: number) { await page.clock.runFor(ms); }
async function provide(page: Page, selector: string, id: string | null) {
  await page.evaluate(({selector, id}) => (window as unknown as Harness).tooltipContextHarness.provide(selector, id), {selector, id});
  await tick(page, 1);
}
async function shown(page: Page, name: string, expected = true) {
  await expect(tip(page, name)).toHaveJSProperty('open', expected);
  await expect.poll(() => tip(page, name).evaluate(element => !!element.shadowRoot?.querySelector(':popover-open'))).toBe(expected);
}
async function hover(page: Page, name: string) { await trigger(page, name).hover(); await tick(page, 1); }
async function warm(page: Page) { await hover(page, 'one'); await tick(page, 300); await shown(page, 'one'); }

test.beforeEach(async ({page}) => {
  await page.goto('/packages/elements/src/tooltip/tests/fixture.html');
  await page.evaluate(async () => {
    await customElements.whenDefined('en-tooltip');
    const tips = [...document.querySelectorAll('body > en-tooltip')];
    tips.forEach(element => element.removeAttribute('warmup-group'));
    await Promise.all(tips.map(element => (element as HTMLElement & {updateComplete: Promise<unknown>}).updateComplete));
  });
  await page.clock.install();
  await page.clock.pauseAt(new Date(Date.now() + 1000));
});

test('remote tooltip hosts use the trigger scope and immediate accepted handoff', async ({page}) => {
  await provide(page, '#tools', 'editing');
  await tip(page, 'one').evaluate(el => el.setAttribute('hide-delay', '5000'));
  await warm(page); await hover(page, 'two');
  await shown(page, 'two'); await shown(page, 'one', false);
  await expect(trigger(page, 'two')).toHaveAttribute('aria-describedby', /\S+/);
});

test('tooltip host ancestry cannot supply the trigger scope', async ({page}) => {
  await page.evaluate(() => {
    const host = document.createElement('div'); host.id = 'tip-host'; document.body.append(host);
    host.append(document.querySelector('#tip-one')!, document.querySelector('#tip-two')!);
    (window as unknown as Harness).tooltipContextHarness.provide('#tip-host', 'wrong');
  });
  await hover(page, 'one'); await tick(page, 300);
  await expect(page.locator('#tip-host > #tip-one')).toHaveJSProperty('open', true);
  await hover(page, 'two'); await tick(page, 250);
  await expect(page.locator('#tip-host > #tip-two')).toHaveJSProperty('open', false);
  await tick(page, 50); await expect(page.locator('#tip-host > #tip-two')).toHaveJSProperty('open', true);
});

for (const explicit of ['other-tools', 'missing']) {
  test(`explicit ${explicit} ID never falls back to inherited warmth`, async ({page}) => {
    await provide(page, '#tools', 'editing');
    await tip(page, 'two').evaluate((el, id) => el.setAttribute('warmup-group', id), explicit);
    await warm(page); await hover(page, 'two'); await tick(page, 250);
    await shown(page, 'two', false); await tick(page, 50); await shown(page, 'two');
  });
}

test('explicit valid group retains its own peers despite differing contexts', async ({page}) => {
  await page.evaluate(() => {
    const nested = document.createElement('span'); nested.id = 'nested';
    document.querySelector('#two')!.before(nested); nested.append(document.querySelector('#two')!);
  });
  await provide(page, '#tools', 'editing');
  await provide(page, '#nested', 'nested');
  await page.evaluate(() => ['one', 'two'].forEach(id => document.querySelector(`#tip-${id}`)!.setAttribute('warmup-group', 'tools')));
  await warm(page); await hover(page, 'two'); await shown(page, 'two');
});

test('nearest provider and explicit undefined isolate nested scopes', async ({page}) => {
  await page.evaluate(() => {
    const nested = document.createElement('span'); nested.id = 'nested';
    document.querySelector('#two')!.before(nested); nested.append(document.querySelector('#two')!);
  });
  await provide(page, '#tools', 'outer'); await provide(page, '#nested', null);
  await warm(page); await hover(page, 'two'); await tick(page, 250); await shown(page, 'two', false);
  await tick(page, 50); await shown(page, 'two');
});

test('a late provider and provider replacement update subscribed remote tooltips', async ({page}) => {
  await warm(page);
  await provide(page, '#tools', 'first');
  await page.mouse.move(1000, 40); await tick(page, 501); await warm(page);
  await provide(page, '#tools', 'replacement');
  await hover(page, 'two'); await tick(page, 250); await shown(page, 'two', false);
  await tick(page, 50); await shown(page, 'two');
  await hover(page, 'three'); await shown(page, 'three');
});

test('moving a trigger to a cold provider restores the first-hover delay', async ({page}) => {
  await provide(page, '#tools', 'first'); await provide(page, '#other-tools', 'second');
  await warm(page);
  await page.evaluate(() => document.querySelector('#other-tools')!.append(document.querySelector('#two')!));
  await tick(page, 1); await hover(page, 'two'); await tick(page, 250); await shown(page, 'two', false);
  await tick(page, 50); await shown(page, 'two');
});

test('a trigger in a shadow root can inherit the outer provider without changing for resolution', async ({page}) => {
  await provide(page, '#tools', 'shared'); await provide(page, '#shadow-fixture', 'shared');
  const shadow = page.locator('#shadow-fixture');
  await shadow.locator('en-tooltip').evaluateAll(tips => tips.forEach(tip => tip.removeAttribute('warmup-group')));
  await warm(page);
  await shadow.getByRole('button', {name: 'Shadow one'}).hover(); await tick(page, 1);
  await expect(shadow.locator('#tip-one')).toHaveJSProperty('open', true);
  await expect(shadow.getByRole('button', {name: 'Shadow one'})).toHaveAttribute('aria-describedby', /\S+/);
});

test('slot reassignment moves a light-DOM trigger between composed provider scopes', async ({page}) => {
  await provide(page, '#tools', 'shared');
  await page.evaluate(() => {
    const host = document.createElement('div');
    const root = host.attachShadow({mode: 'open'});
    root.innerHTML = '<div id="left"><slot name="left"></slot></div><div id="right"><slot name="right"></slot></div>';
    document.querySelector('#tools')!.append(host);
    const trigger = document.querySelector<HTMLButtonElement>('#two')!;
    trigger.slot = 'left'; host.append(trigger);
    const harness = (window as unknown as Harness).tooltipContextHarness;
    harness.provide(root.querySelector<HTMLElement>('#left')!, 'shared');
    harness.provide(root.querySelector<HTMLElement>('#right')!, 'isolated');
  });
  await tick(page, 1); await warm(page); await hover(page, 'two'); await shown(page, 'two');
  await hover(page, 'one'); await shown(page, 'one');
  await trigger(page, 'two').evaluate(element => element.setAttribute('slot', 'right'));
  await tick(page, 1); await hover(page, 'two');
  await tick(page, 250); await shown(page, 'two', false);
  await tick(page, 50); await shown(page, 'two');
});

test('focus priority, accepted Escape and fresh hover retain existing semantics', async ({page}) => {
  await provide(page, '#tools', 'editing');
  await trigger(page, 'one').focus(); await shown(page, 'one');
  await hover(page, 'two'); await tick(page, 500); await shown(page, 'two', false);
  await page.keyboard.press('Escape'); await shown(page, 'one', false);
  await tick(page, 300); await shown(page, 'two');
  await expect(trigger(page, 'one')).toBeFocused();
});

test('context handoff remains cancelable and last-member removal resets warmth', async ({page}) => {
  await provide(page, '#tools', 'editing');
  await tip(page, 'one').evaluate(el => {
    el.setAttribute('hide-delay', '5000');
    el.addEventListener('en-change', event => {if (!(event as CustomEvent).detail.proposed) event.preventDefault();});
  });
  await warm(page); await hover(page, 'two'); await shown(page, 'one'); await shown(page, 'two');
  await page.evaluate(() => {
    const tips = [...document.querySelectorAll('body > en-tooltip')];
    tips.forEach(tip => tip.remove());
    document.body.append(...tips);
  });
  await page.mouse.move(1000, 40); await tick(page, 1);
  await hover(page, 'three'); await tick(page, 250); await shown(page, 'three', false);
  await tick(page, 50); await shown(page, 'three');
});
