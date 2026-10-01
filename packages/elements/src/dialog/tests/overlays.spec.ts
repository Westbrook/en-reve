import { test, expect } from '@playwright/test';
import { placed } from '../../../../../tooling/browser/settling.js';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => (window as any).overlaysReady);
});

test('modal has a name, contains keyboard focus, and restores its opener', async ({ page }) => {
  await expect.poll(() => page.locator('link[rel="stylesheet"]').evaluate(link =>
    (link as HTMLLinkElement).sheet?.cssRules.length ?? 0)).toBeGreaterThan(0);
  const opener = page.getByRole('button', { name: 'Open dialog', exact: true });
  await opener.focus();
  await opener.press('Enter');
  const dialog = page.getByRole('dialog', { name: 'Review changes' });
  await expect(dialog).toBeVisible();
  await page.getByRole('textbox', { name: 'Review note' }).fill('Reviewed spacing');
  await page.getByRole('button', { name: 'Outside action' }).focus();
  await expect(page.getByRole('button', { name: 'Outside action' })).not.toBeFocused();
  await page.getByRole('textbox', { name: 'Review note' }).focus();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('textbox', { name: 'Approval note' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(opener).toBeFocused();
});

test('canceling tentative Escape changes retains modality and synchronous author writes stay silent', async ({ page }) => {
  await page.getByRole('button', { name: 'Open dialog', exact: true }).click();
  const host = page.locator('#dialog');
  const surface = page.getByRole('dialog', { name: 'Review changes' });
  const input = page.getByRole('textbox', { name: 'Review note' });
  await input.focus();
  expect(await host.evaluate(element => 'controlled' in element)).toBe(false);
  await page.evaluate(() => { (window as any).cancelOverlayChanges = true; });
  await page.keyboard.press('Escape');
  await expect(surface).toBeVisible();
  await expect(input).toBeFocused();
  await expect(host).toHaveJSProperty('open', true);
  expect(await page.evaluate(() => (window as any).overlayEvents.filter((event: any) => event.reason === 'escape'))).toEqual([
    expect.objectContaining({ type: 'en-change', previous: true, proposed: false, open: false,
      surfaceOpen: true, modal: true, cancelable: true, bubbles: true, composed: true }),
  ]);
  await host.evaluate((element: any) => {
    element.addEventListener('en-change', (event: Event) => { event.preventDefault(); element.open = true; }, { once: true });
  });
  await page.keyboard.press('Escape');
  await expect(surface).toBeVisible();
  await expect(input).toBeFocused();
  expect(await page.evaluate(() => (window as any).overlayEvents.filter((event: any) => event.target === 'dialog').length)).toBe(3);
  await host.evaluate((element: any) => { element.open = false; });
  await expect(surface).not.toBeVisible();
  expect(await page.evaluate(() => (window as any).overlayEvents.filter((event: any) => event.target === 'dialog').length)).toBe(3);
});

test('backdrop dismissal is cancelable before native modal effects occur', async ({ page }) => {
  await page.getByRole('button', { name: 'Open dialog', exact: true }).click();
  await page.evaluate(() => { (window as any).cancelOverlayChanges = true; });
  await page.mouse.click(2, 2);
  await expect(page.getByRole('dialog', { name: 'Review changes' })).toBeVisible();
  await page.evaluate(() => { (window as any).cancelOverlayChanges = false; });
  await page.mouse.click(2, 2);
  await expect(page.getByRole('dialog', { name: 'Review changes' })).not.toBeVisible();
});

test('drawer uses the shared modal dismissal contract', async ({ page }) => {
  await page.getByRole('button', { name: 'Open drawer', exact: true }).focus();
  await page.getByRole('button', { name: 'Open drawer', exact: true }).press('Enter');
  const drawer = page.getByRole('dialog', { name: 'Theme options' });
  await expect(drawer).toBeVisible();
  await drawer.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(drawer).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Open drawer', exact: true })).toBeFocused();
});

test('popover has nonmodal dialog semantics and supports Escape and outside dismissal', async ({ page }) => {
  const trigger = page.getByRole('button', { name: 'Share options' });
  await trigger.click();
  const popover = page.getByRole('dialog', { name: 'Share settings' });
  await expect(popover).toBeVisible();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(popover).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.evaluate(() => { (window as any).cancelOverlayChanges = true; });
  await page.getByRole('button', { name: 'Outside action' }).click();
  await expect(popover).toBeVisible();
  await page.evaluate(() => { (window as any).cancelOverlayChanges = false; });
  await page.getByRole('button', { name: 'Outside action' }).focus();
  await page.getByRole('button', { name: 'Outside action' }).click();
  await expect(popover).not.toBeVisible();
  await expect(trigger).not.toBeFocused();
});

test('tooltip description resolves to light content and is hoverable and dismissible', async ({ page }) => {
  const trigger = page.getByRole('button', { name: 'History', exact: true });
  await trigger.focus();
  await expect(trigger).toHaveAccessibleDescription('Your project history. View previous revisions');
  const tooltip = page.locator('#tooltip').getByRole('tooltip');
  await expect(tooltip).toBeVisible();
  expect(await trigger.evaluate(element => {
    const id = element.getAttribute('aria-describedby')!.split(' ').at(-1)!;
    const target = (element.getRootNode() as Document).getElementById(id);
    return target?.textContent;
  })).toBe('View previous revisions');
  await page.keyboard.press('Escape');
  await expect(tooltip).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await page.getByRole('button', { name: 'Outside action' }).focus();
  await page.mouse.move(1, 1);
  await trigger.hover();
  await expect(tooltip).toBeVisible();
  await tooltip.hover();
  await expect(tooltip).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(tooltip).not.toBeVisible();
});

test('disconnecting a tooltip restores supplied description and content attributes', async ({ page }) => {
  expect(await page.evaluate(() => {
    const host = document.querySelector('#tooltip')!;
    const trigger = document.querySelector('#history-trigger')!;
    const content = host.querySelector('[slot="content"]')!;
    host.remove();
    return { describedBy: trigger.getAttribute('aria-describedby'), role: content.getAttribute('role'), id: content.id };
  })).toEqual({ describedBy: 'extra-description', role: null, id: '' });
});

for (const target of ['dialog', 'fallback-dialog']) {
  test(`${target}: closedBy any keeps native and fallback light dismissal cancelable`, async ({ page }) => {
    const nativeAvailable = await page.evaluate(() => 'closedBy' in HTMLDialogElement.prototype);
    test.info().annotations.push({ type: 'closedBy path', description: target === 'fallback-dialog' ? 'forced compatibility adapter' : nativeAvailable ? 'native closedBy' : 'compatibility adapter (native unavailable)' });
    await page.evaluate(id => {
      const element = document.getElementById(id) as any;
      element.closedBy = 'any'; element.show();
      (window as any).cancelOverlayChanges = true;
    }, target);
    const surface = page.getByRole('dialog', { name: target === 'dialog' ? 'Review changes' : 'Fallback policy' });
    await expect(surface).toBeVisible();
    await expect(page.locator(`#${target}`)).toHaveAttribute('closedby', 'any');
    await page.mouse.click(2, 2);
    await expect(surface).toBeVisible();
    expect(await page.evaluate(id => (window as any).overlayEvents.filter((event: any) => event.target === id && event.type === 'en-change' && !event.proposed).length, target)).toBe(1);
    await page.evaluate(() => { (window as any).cancelOverlayChanges = true; });
    await page.mouse.click(2, 2);
    await expect(surface).toBeVisible();
    await page.evaluate(() => { (window as any).cancelOverlayChanges = false; });
    const bounds = (await surface.boundingBox())!;
    await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    await page.mouse.down();
    await page.mouse.move(2, 2, { steps: 8 });
    await page.mouse.up();
    await expect(surface).toBeVisible();
    expect(await page.evaluate(id => (window as any).overlayEvents.filter((event: any) => event.target === id && event.type === 'en-change' && !event.proposed).length, target)).toBe(2);
    await page.mouse.click(2, 2);
    await expect(surface).not.toBeVisible();
    expect(await page.evaluate(id => (window as any).overlayEvents.filter((event: any) => event.target === id && event.type === 'en-change' && !event.proposed).length, target)).toBe(3);
  });

  test(`${target}: closerequest permits Escape and none retains the explicit close action`, async ({ page }) => {
    await page.evaluate(id => { const element = document.getElementById(id) as any; element.closedBy = 'closerequest'; element.show(); }, target);
    const surface = page.getByRole('dialog', { name: target === 'dialog' ? 'Review changes' : 'Fallback policy' });
    await expect(surface).toBeVisible();
    await page.mouse.click(2, 2);
    await expect(surface).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(surface).not.toBeVisible();
    await page.evaluate(id => {
      const element = document.getElementById(id) as any;
      element.closedBy = 'none'; element.show(); (window as any).overlayEvents = [];
    }, target);
    await expect(surface).toBeVisible();
    await page.mouse.click(2, 2);
    await page.keyboard.press('Escape');
    await expect(surface).toBeVisible();
    expect(await page.evaluate(() => (window as any).overlayEvents.length)).toBe(0);
    await surface.getByRole('button', { name: 'Close', exact: true }).click();
    await expect(surface).not.toBeVisible();
    expect(await page.evaluate(() => (window as any).overlayEvents.filter((event: any) => event.type === 'en-change').length)).toBe(1);
  });
}

test('responsive dialog changes presentation without replacing the open surface or losing edits and focus', async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 800 });
  await page.evaluate(() => {
    const dialog = document.querySelector('#dialog') as any;
    dialog.presentation = 'responsive'; dialog.responsiveQuery = '(width < 700px)'; dialog.show();
    (window as any).savedDialogSurface = dialog.shadowRoot.querySelector('dialog');
  });
  const surface = page.getByRole('dialog', { name: 'Review changes' });
  const input = page.getByRole('textbox', { name: 'Review note' });
  await input.fill('Preserve this edit');
  await expect(input).toBeFocused();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(surface).toBeVisible();
  await expect(input).toBeFocused();
  await expect(input).toHaveValue('Preserve this edit');
  await expect.poll(async () => {
    const bounds = (await surface.boundingBox())!;
    return Math.abs(bounds.y + bounds.height - 844) < 2 && Math.abs(bounds.width - 390) < 2;
  }).toBe(true);
  expect(await page.evaluate(() => (window as any).savedDialogSurface === document.querySelector('#dialog')!.shadowRoot!.querySelector('dialog'))).toBe(true);
  await page.setViewportSize({ width: 1000, height: 800 });
  await expect(input).toBeFocused();
  await expect.poll(async () => {
    const bounds = (await surface.boundingBox())!;
    return bounds.width < 800 && bounds.y > 0;
  }).toBe(true);
  expect(await page.evaluate(() => (window as any).overlayEvents.filter((event: any) => event.target === 'dialog' && event.type === 'en-change').length)).toBe(1);
  await page.keyboard.press('Escape');
  await expect(surface).not.toBeVisible();
});

test('overlay label slots name the actual surface and restore the attribute fallback', async ({ page }) => {
  for (const id of ['dialog', 'drawer', 'popover']) {
    const fallback = id === 'dialog' ? 'Review changes' : id === 'drawer' ? 'Theme options' : 'Share settings';
    await page.evaluate(target => {
      const element = document.getElementById(target) as any;
      const label = document.createElement('span'); label.slot = 'label'; label.innerHTML = '<em>Detailed</em> review';
      element.append(label); element.open = true;
    }, id);
    await expect(page.getByRole('dialog', { name: 'Detailed review', exact: true })).toBeVisible();
    await page.evaluate(target => { document.getElementById(target)!.querySelector('[slot="label"]')!.remove(); }, id);
    await expect(page.getByRole('dialog', { name: fallback, exact: true })).toBeVisible();
    await page.evaluate(target => { (document.getElementById(target) as any).open = false; }, id);
    await expect(page.getByRole('dialog', { name: fallback, exact: true })).not.toBeVisible();
  }
});

test('tooltip safe corridor permits slow pointer transit in both directions and leaves unrelated clicks usable', async ({ page }) => {
  await page.evaluate(() => {
    const tooltip = document.querySelector('#tooltip') as any;
    tooltip.style.setProperty('--en-space-2', '80px');
    tooltip.hideDelay = 40; tooltip.transitDuration = 1200;
  });
  const trigger = page.getByRole('button', { name: 'History', exact: true });
  const content = page.locator('#tooltip').getByRole('tooltip');
  await trigger.hover();
  await expect(content).toBeVisible();
  const triggerBounds = (await trigger.boundingBox())!;
  const surface = page.locator('#tooltip [part~="surface"]');
  await placed(surface);
  const surfaceBounds = await surface.evaluate(element => element.getBoundingClientRect().toJSON());
  const start = { x: triggerBounds.x + triggerBounds.width / 2, y: triggerBounds.y + triggerBounds.height - 1 };
  const end = { x: Math.min(surfaceBounds.right - 2, Math.max(surfaceBounds.left + 2, start.x)), y: surfaceBounds.top + 2 };
  await page.mouse.move(start.x, start.y);
  for (let step = 1; step <= 6; step++) {
    await page.mouse.move(start.x + (end.x - start.x) * step / 6, start.y + (end.y - start.y) * step / 6);
    await page.waitForTimeout(60);
    await expect(content).toBeVisible();
  }
  for (let step = 1; step <= 6; step++) {
    await page.mouse.move(end.x + (start.x - end.x) * step / 6, end.y + (start.y - end.y) * step / 6);
    await page.waitForTimeout(60);
    await expect(content).toBeVisible();
  }
  await page.getByRole('button', { name: 'Outside action' }).click();
  await expect(content).not.toBeVisible();
});

test('tooltip transit expires in the gap and Escape cancels an active corridor', async ({ page }) => {
  await page.evaluate(() => {
    const tooltip = document.querySelector('#tooltip') as any;
    tooltip.style.setProperty('--en-space-2', '80px');
    tooltip.hideDelay = 30; tooltip.transitDuration = 250;
  });
  const trigger = page.getByRole('button', { name: 'History', exact: true });
  const content = page.locator('#tooltip').getByRole('tooltip');
  await trigger.hover();
  await expect(content).toBeVisible();
  const bounds = (await trigger.boundingBox())!;
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height + 20);
  await expect(content).toBeVisible();
  await expect(content).not.toBeVisible({ timeout: 1000 });
  await trigger.hover();
  await expect(content).toBeVisible();
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height + 20);
  await page.keyboard.press('Escape');
  await expect(content).not.toBeVisible();
});

test('tooltip focus persistence is independent of pointer transit and Escape does not refocus', async ({ page }) => {
  const trigger = page.getByRole('button', { name: 'History', exact: true });
  const content = page.locator('#tooltip').getByRole('tooltip');
  await page.evaluate(() => {
    const tooltip = document.querySelector('#tooltip') as any;
    tooltip.hideDelay = 20; tooltip.transitDuration = 40;
  });
  await trigger.focus();
  await expect(content).toBeVisible();
  await page.mouse.move(2, 700);
  await page.waitForTimeout(100);
  await expect(content).toBeVisible();
  await expect(trigger).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(content).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await page.mouse.move(3, 700);
  await expect(content).not.toBeVisible();
  await page.getByRole('button', { name: 'Outside action' }).focus();
  await trigger.focus();
  await expect(content).toBeVisible();
});

test('en-button popover trigger forwards semantic state and restores the actual focused button', async ({ page }) => {
  const trigger = page.getByRole('button', { name: 'Component share', exact: true });
  await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await trigger.click();
  const surface = page.getByRole('dialog', { name: 'Component share settings' });
  await expect(surface).toBeVisible();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(surface).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await page.evaluate(() => {
    const trigger = document.querySelector('#component-share-trigger') as any;
    trigger.disabled = true; trigger.click();
  });
  await expect(surface).not.toBeVisible();
  await expect(trigger).toBeDisabled();
});

test('en-button tooltip forwards real description references and responds to focus and hover', async ({ page, browserName }) => {
  const trigger = page.getByRole('button', { name: 'Component history', exact: true });
  const content = page.locator('#component-tooltip').getByRole('tooltip');
  await trigger.focus();
  await expect(content).toBeVisible();
  const verifyRelationships = async () => {
    await expect.poll(() => trigger.evaluate(element => {
      const references = element.ariaDescribedByElements;
      return references?.length === 2 && references[0] === document.getElementById('extra-description')
        && references[1] === document.querySelector('#component-tooltip [slot="content"]');
    })).toBe(true);
  };
  const cdp = browserName === 'chromium' ? await page.context().newCDPSession(page) : null;
  const verifyNativeDescription = async (description: string) => {
    if (!cdp) return;
    await expect.poll(async () => {
      const { nodes } = await cdp.send('Accessibility.getFullAXTree');
      return nodes.find(node => node.role?.value === 'button' && node.name?.value === 'Component history')?.description?.value;
    }).toBe(description);
  };
  test.info().annotations.push({ type: 'description verification', description: cdp ? 'Native Chromium accessibility tree and reflected element identities' : 'Reflected element identities; platform assistive output remains manual' });
  await verifyRelationships();
  await verifyNativeDescription('Your project history. Browse component revisions');
  await page.keyboard.press('Escape');
  await expect(content).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await page.getByRole('button', { name: 'Outside action' }).focus();
  await trigger.hover();
  await expect(content).toBeVisible();
  await page.evaluate(() => {
    const host = document.querySelector('#component-tooltip')!;
    const replacement = document.createElement('span'); replacement.slot = 'content'; replacement.textContent = 'Updated component revisions';
    host.querySelector('[slot="content"]')!.replaceWith(replacement);
  });
  await verifyRelationships();
  await verifyNativeDescription('Your project history. Updated component revisions');
  await page.keyboard.press('Escape');
  await expect(content).not.toBeVisible();
  expect(await page.evaluate(() => {
    const host = document.querySelector('#component-tooltip')!;
    const trigger = document.querySelector('#component-history-trigger')!;
    host.remove();
    return trigger.getAttribute('aria-describedby');
  })).toBe('extra-description');
  await cdp?.detach();
});

for (const [hostId, triggerId, triggerName, surfaceName] of [
  ['popover', 'share-trigger', 'Share options', 'Share settings'],
  ['component-popover', 'component-share-trigger', 'Component share', 'Component share settings'],
]) {
  test(`${hostId}: external trigger activates by keyboard and clicking it again closes once`, async ({ page }) => {
    const trigger = page.getByRole('button', { name: triggerName, exact: true });
    const surface = page.getByRole('dialog', { name: surfaceName, exact: true });
    expect(await page.evaluate(([hostId, triggerId]) => document.getElementById(hostId)!.contains(document.getElementById(triggerId)), [hostId, triggerId])).toBe(false);
    await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await trigger.focus();
    await trigger.press('Enter');
    await expect(surface).toBeVisible();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await trigger.click();
    await expect(surface).not.toBeVisible();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    const events = await page.evaluate(id => (window as any).overlayEvents.filter((event: any) => event.target === id), hostId);
    expect(events.filter((event: any) => event.type === 'en-change').map((event: any) => [event.reason, event.proposed])).toEqual([['trigger', true], ['trigger', false]]);
    await trigger.press('Space');
    await expect(surface).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(surface).not.toBeVisible();
    await expect(trigger).toBeFocused();
  });
}

test('for property and attribute changes release the old trigger and bind the current id', async ({ page }) => {
  const original = page.getByRole('button', { name: 'Share options', exact: true });
  const alternate = page.getByRole('button', { name: 'Alternate share', exact: true });
  const surface = page.getByRole('dialog', { name: 'Share settings' });
  await expect(original).toHaveAttribute('aria-expanded', 'false');
  await page.evaluate(() => { (document.getElementById('popover') as any).for = 'alternate-trigger'; });
  await expect(alternate).toHaveAttribute('aria-expanded', 'false');
  await expect(original).not.toHaveAttribute('aria-haspopup');
  await expect(original).not.toHaveAttribute('aria-expanded');
  await original.click();
  await expect(surface).not.toBeVisible();
  await alternate.click();
  await expect(surface).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(alternate).toBeFocused();
  await page.locator('#popover').evaluate(host => host.setAttribute('for', 'share-trigger'));
  await expect(original).toHaveAttribute('aria-expanded', 'false');
  await expect(alternate).not.toHaveAttribute('aria-expanded');
  await original.click();
  await expect(surface).toBeVisible();
});

test('same-id trigger replacement, removal, and late insertion update the binding without stale listeners', async ({ page }) => {
  const surface = page.getByRole('dialog', { name: 'Share settings' });
  await page.evaluate(() => {
    const old = document.getElementById('share-trigger')!;
    const replacement = document.createElement('button');
    replacement.id = 'share-trigger'; replacement.textContent = 'Replacement share';
    old.replaceWith(replacement);
    old.id = 'retired-share-trigger'; old.textContent = 'Retired share';
    document.body.append(old);
  });
  const replacement = page.getByRole('button', { name: 'Replacement share', exact: true });
  await expect(replacement).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('#retired-share-trigger')).not.toHaveAttribute('aria-expanded');
  await page.getByRole('button', { name: 'Retired share', exact: true }).click();
  await expect(surface).not.toBeVisible();
  await replacement.click();
  await expect(surface).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(surface).not.toBeVisible();
  await page.locator('#share-trigger').evaluate(trigger => { (window as any).removedShareTrigger = trigger; trigger.remove(); });
  await expect.poll(() => page.evaluate(() => (window as any).removedShareTrigger.hasAttribute('aria-expanded'))).toBe(false);
  await page.evaluate(() => {
    const late = document.createElement('button'); late.id = 'share-trigger'; late.textContent = 'Late share';
    document.body.prepend(late);
  });
  const late = page.getByRole('button', { name: 'Late share', exact: true });
  await expect(late).toHaveAttribute('aria-expanded', 'false');
  await late.click();
  await expect(surface).toBeVisible();
});

test('for resolves only within its tree despite duplicate ids and missing local matches', async ({ page }) => {
  const a = page.locator('#shadow-a');
  const b = page.locator('#shadow-b');
  const missing = page.locator('#shadow-missing');
  const aTrigger = a.getByRole('button', { name: 'Scope A trigger' });
  const bTrigger = b.getByRole('button', { name: 'Scope B trigger' });
  await expect(aTrigger).toHaveAttribute('aria-expanded', 'false');
  await expect(bTrigger).toHaveAttribute('aria-expanded', 'false');
  await expect(aTrigger).toHaveAccessibleDescription('Scope A hint');
  await expect(bTrigger).toHaveAccessibleDescription('Scope B hint');
  const decoy = page.getByRole('button', { name: 'Document decoy' });
  await expect(decoy).not.toHaveAttribute('aria-haspopup');
  await expect(decoy).not.toHaveAttribute('aria-describedby');
  await decoy.click();
  await expect(a.getByRole('dialog')).not.toBeVisible();
  await expect(b.getByRole('dialog')).not.toBeVisible();
  await expect(missing.getByRole('dialog')).not.toBeVisible();
  await aTrigger.click();
  await expect(a.getByRole('dialog', { name: 'Scope A options' })).toBeVisible();
  await expect(b.getByRole('dialog')).not.toBeVisible();
  await page.keyboard.press('Escape');
  await expect(a.getByRole('dialog')).not.toBeVisible();
  await expect(aTrigger).toBeFocused();
  // Returning focus can reopen its hint over the next tightly stacked fixture.
  await page.keyboard.press('Escape');
  await expect(a.getByRole('tooltip')).not.toBeVisible();
  await bTrigger.click();
  await expect(b.getByRole('dialog', { name: 'Scope B options' })).toBeVisible();
  await expect(a.getByRole('dialog')).not.toBeVisible();
  await page.keyboard.press('Escape');
  await expect(b.getByRole('dialog')).not.toBeVisible();
  await expect(bTrigger).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(b.getByRole('tooltip')).not.toBeVisible();
  await missing.evaluate(host => {
    const trigger = document.createElement('button'); trigger.id = 'same-trigger'; trigger.textContent = 'Late local trigger';
    host.shadowRoot!.prepend(trigger);
  });
  const late = missing.getByRole('button', { name: 'Late local trigger' });
  await expect(late).toHaveAttribute('aria-expanded', 'false');
  await late.click();
  await expect(missing.getByRole('dialog', { name: 'Late scope options' })).toBeVisible();
});

for (const [popoverId, triggerId, triggerName, surfaceName] of [
  ['popover', 'share-trigger', 'Share options', 'Share settings'],
  ['component-popover', 'component-share-trigger', 'Component share', 'Component share settings'],
]) {
test(`${popoverId}: popover and tooltip share an external button without losing either semantic relationship`, async ({ page }) => {
  await page.evaluate(triggerId => {
    const tooltip = document.createElement('en-tooltip'); tooltip.id = 'shared-tooltip';
    tooltip.setAttribute('for', triggerId); tooltip.setAttribute('show-delay', '0');
    const content = document.createElement('span'); content.slot = 'content'; content.textContent = 'Choose who can collaborate';
    tooltip.append(content); document.body.append(tooltip);
  }, triggerId);
  const trigger = page.getByRole('button', { name: triggerName, exact: true });
  const tooltip = page.locator('#shared-tooltip').getByRole('tooltip');
  const verifyDescription = async () => {
    if (popoverId === 'component-popover') {
      await expect.poll(() => trigger.evaluate(element => {
        const references = element.ariaDescribedByElements;
        return references?.length === 1 && references[0] === document.querySelector('#shared-tooltip [slot="content"]');
      })).toBe(true);
    } else {
      await expect(trigger).toHaveAccessibleDescription('Choose who can collaborate');
    }
  };
  test.info().annotations.push({ type: 'shared description verification', description: popoverId === 'component-popover'
    ? 'Actual native control reflected element identities; synthesized description matcher does not consume these references'
    : 'Native button accessible-description matcher' });
  await verifyDescription();
  await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
  await trigger.focus();
  await expect(tooltip).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(tooltip).not.toBeVisible();
  await trigger.press('Enter');
  const surface = page.getByRole('dialog', { name: surfaceName });
  await expect(surface).toBeVisible();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await verifyDescription();
  await page.locator('#shared-tooltip').evaluate(host => host.remove());
  await expect(page.locator(`#${triggerId}`)).not.toHaveAttribute('aria-describedby');
  if (popoverId === 'component-popover') {
    await expect.poll(() => trigger.evaluate(element => element.ariaDescribedByElements?.length ?? 0)).toBe(0);
  }
  await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(surface).not.toBeVisible();
  await expect(trigger).toBeFocused();
});

}

test('external popover trigger exposes tentative changes while cancellation retains accepted presentation', async ({ page }) => {
  const trigger = page.getByRole('button', { name: 'Share options', exact: true });
  const surface = page.getByRole('dialog', { name: 'Share settings' });
  const host = page.locator('#popover');
  expect(await host.evaluate(element => 'controlled' in element)).toBe(false);
  await page.evaluate(() => { (window as any).cancelOverlayChanges = true; });
  await trigger.click();
  await expect(surface).not.toBeVisible();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await expect(host).toHaveJSProperty('open', false);
  await trigger.click();
  await expect(surface).not.toBeVisible();
  const openingAttempts = await page.evaluate(() => (window as any).overlayEvents.filter((event: any) => event.target === 'popover'));
  expect(openingAttempts).toHaveLength(2);
  for (const event of openingAttempts) expect(event).toEqual(expect.objectContaining({ open: true, proposed: true, cancelable: true }));
  await host.evaluate((element: any) => { element.open = true; });
  await expect(surface).toBeVisible();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await trigger.click();
  await expect(surface).toBeVisible();
  await expect(host).toHaveJSProperty('open', true);
  await host.evaluate((element: any) => { element.open = false; });
  await expect(surface).not.toBeVisible();
  expect(await page.evaluate(() => (window as any).overlayEvents.filter((event: any) => event.target === 'popover').length)).toBe(3);
});

test('disconnect restores author ARIA while reconnect attaches one active popover binding', async ({ page }) => {
  await page.evaluate(() => {
    const trigger = document.createElement('button'); trigger.id = 'authored-trigger'; trigger.textContent = 'Authored trigger';
    trigger.setAttribute('aria-haspopup', 'menu'); trigger.setAttribute('aria-expanded', 'true');
    trigger.setAttribute('aria-controls', 'author-target'); trigger.setAttribute('aria-describedby', 'extra-description');
    const popover = document.createElement('en-popover'); popover.id = 'authored-popover';
    popover.setAttribute('for', trigger.id); popover.setAttribute('label', 'Authored options');
    document.body.append(trigger, popover);
  });
  const trigger = page.getByRole('button', { name: 'Authored trigger' });
  await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await expect(trigger).toHaveAttribute('aria-controls', 'author-target');
  await expect(trigger).toHaveAccessibleDescription('Your project history.');
  await page.locator('#authored-popover').evaluate(host => { (window as any).detachedPopover = host; host.remove(); });
  await expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await trigger.click();
  expect(await page.evaluate(() => (window as any).detachedPopover.open)).toBe(false);
  expect(await page.evaluate(() => (window as any).overlayEvents.filter((event: any) => event.target === 'authored-popover').length)).toBe(0);
  await page.evaluate(() => document.body.append((window as any).detachedPopover));
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await trigger.click();
  await expect(page.getByRole('dialog', { name: 'Authored options' })).toBeVisible();
  expect(await page.evaluate(() => (window as any).overlayEvents.filter((event: any) => event.target === 'authored-popover' && event.type === 'en-change').length)).toBe(1);
  await trigger.evaluate(element => { element.setAttribute('aria-haspopup', 'tree'); element.setAttribute('aria-expanded', 'false'); });
  await page.locator('#authored-popover').evaluate(host => host.remove());
  await expect(trigger).toHaveAttribute('aria-haspopup', 'tree');
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
});

test('tooltip rebinding preserves author descriptions and disconnect cancels delayed hover work', async ({ page }) => {
  const original = page.getByRole('button', { name: 'History', exact: true });
  const alternate = page.getByRole('button', { name: 'Alternate share', exact: true });
  await page.evaluate(() => document.getElementById('alternate-trigger')!.setAttribute('aria-describedby', 'extra-description'));
  await page.locator('#tooltip').evaluate((host: any) => { host.for = 'alternate-trigger'; host.showDelay = 1000; });
  await expect(original).toHaveAttribute('aria-describedby', 'extra-description');
  await expect(alternate).toHaveAccessibleDescription('Your project history. View previous revisions');
  await original.focus();
  await expect(page.locator('#tooltip').getByRole('tooltip')).not.toBeVisible();
  await page.getByRole('button', { name: 'Outside action' }).focus();
  await alternate.hover();
  await page.locator('#tooltip').evaluate(host => { (window as any).detachedTooltip = host; host.remove(); });
  await expect(alternate).toHaveAttribute('aria-describedby', 'extra-description');
  // The delay is the behavior under test: disposed work must not commit later.
  await page.waitForTimeout(1100);
  expect(await page.evaluate(() => (window as any).detachedTooltip.open)).toBe(false);
  await alternate.focus();
  expect(await page.evaluate(() => (window as any).detachedTooltip.open)).toBe(false);
  await page.evaluate(() => document.body.append((window as any).detachedTooltip));
  await expect(alternate).toHaveAccessibleDescription('Your project history. View previous revisions');
  await page.getByRole('button', { name: 'Outside action' }).focus();
  await alternate.focus();
  await expect(page.locator('#tooltip').getByRole('tooltip')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#tooltip').getByRole('tooltip')).not.toBeVisible();
});

test('an unresolved initially open popover waits for its local trigger without inventing a commit', async ({ page }) => {
  await page.evaluate(() => {
    const popover = document.createElement('en-popover') as any;
    popover.id = 'deferred-popover'; popover.for = 'not-present-yet'; popover.label = 'Deferred options'; popover.open = true;
    document.body.append(popover);
  });
  const surface = page.getByRole('dialog', { name: 'Deferred options' });
  await expect(page.locator('#deferred-popover')).toHaveJSProperty('open', true);
  await expect(surface).not.toBeVisible();
  await page.evaluate(() => {
    const button = document.createElement('button'); button.id = 'not-present-yet'; button.textContent = 'Resolved late';
    document.body.append(button);
  });
  await expect(surface).toBeVisible();
  await expect(page.getByRole('button', { name: 'Resolved late' })).toHaveAttribute('aria-expanded', 'true');
  expect(await page.evaluate(() => (window as any).overlayEvents.filter((event: any) => event.target === 'deferred-popover' && event.type === 'en-change').length)).toBe(0);
});

test('an open popover preserves its nested focused control and original opener through valid rebinding', async ({ page }) => {
  await page.evaluate(() => {
    const button = document.createElement('en-button'); button.textContent = 'Continue reviewing';
    document.getElementById('popover')!.append(button);
  });
  const original = page.getByRole('button', { name: 'Share options', exact: true });
  const alternate = page.getByRole('button', { name: 'Alternate share', exact: true });
  await original.click();
  const surface = page.getByRole('dialog', { name: 'Share settings' });
  const nested = page.locator('#popover').getByRole('button', { name: 'Continue reviewing', exact: true });
  await nested.focus();
  await surface.evaluate(element => { (window as any).savedReboundSurface = element; });
  await page.locator('#popover').evaluate((host: any) => { host.for = 'alternate-trigger'; });
  await expect(alternate).toHaveAttribute('aria-expanded', 'true');
  await expect(nested).toBeFocused();
  expect(await surface.evaluate(element => element === (window as any).savedReboundSurface)).toBe(true);
  await page.keyboard.press('Escape');
  await expect(surface).not.toBeVisible();
  await expect(original).toBeFocused();
  await expect(alternate).not.toBeFocused();
});

test('removing the anchor leaves an already open popover usable without losing nested focus', async ({ page }) => {
  await page.evaluate(() => {
    const button = document.createElement('en-button'); button.textContent = 'Keep this focus';
    document.getElementById('popover')!.append(button);
  });
  await page.getByRole('button', { name: 'Share options', exact: true }).click();
  const surface = page.getByRole('dialog', { name: 'Share settings' });
  const nested = page.locator('#popover').getByRole('button', { name: 'Keep this focus', exact: true });
  await nested.focus();
  const previousBounds = await surface.boundingBox();
  await surface.evaluate(element => { (window as any).savedOrphanSurface = element; });
  await page.locator('#share-trigger').evaluate(trigger => { (window as any).orphanTrigger = trigger; trigger.remove(); });
  await expect.poll(() => page.evaluate(() => (window as any).orphanTrigger.hasAttribute('aria-expanded'))).toBe(false);
  await expect(surface).toBeVisible();
  await expect(nested).toBeFocused();
  await expect(page.locator('#popover')).toHaveJSProperty('open', true);
  expect(await surface.boundingBox()).toEqual(previousBounds);
  expect(await surface.evaluate(element => element === (window as any).savedOrphanSurface)).toBe(true);
  expect(await page.evaluate(() => (window as any).overlayEvents.filter((event: any) => event.target === 'popover' && event.type === 'en-change').length)).toBe(1);
  await page.keyboard.press('Escape');
  await expect(surface).not.toBeVisible();
});

test('a native trigger disabled by its fieldset cannot activate the popover', async ({ page }) => {
  await page.evaluate(() => {
    const fieldset = document.createElement('fieldset'); fieldset.id = 'disabled-trigger-group'; fieldset.disabled = true;
    document.body.prepend(fieldset); fieldset.append(document.getElementById('share-trigger')!);
  });
  const trigger = page.getByRole('button', { name: 'Share options', exact: true });
  await expect(trigger).toBeDisabled();
  const bounds = (await trigger.boundingBox())!;
  await page.mouse.click(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  await expect(page.getByRole('dialog', { name: 'Share settings' })).not.toBeVisible();
  expect(await page.evaluate(() => (window as any).overlayEvents.filter((event: any) => event.target === 'popover').length)).toBe(0);
  await page.locator('#disabled-trigger-group').evaluate((fieldset: HTMLFieldSetElement) => { fieldset.disabled = false; });
  await trigger.click();
  await expect(page.getByRole('dialog', { name: 'Share settings' })).toBeVisible();
});

for (const mode of ['canceled', 'author-kept-open']) {
  test(`tooltip losing its external anchor respects ${mode} state and remains dismissible`, async ({ page }) => {
    const trigger = page.getByRole('button', { name: 'History', exact: true });
    const content = page.locator('#tooltip').getByRole('tooltip');
    await trigger.focus();
    await expect(content).toBeVisible();
    await page.evaluate(mode => {
      (window as any).overlayEvents = [];
      (window as any).cancelOverlayChanges = mode === 'canceled';
      const authority = new AbortController();
      (window as any).tooltipAuthority = authority;
      if (mode === 'author-kept-open') {
        const tooltip = document.getElementById('tooltip') as any;
        tooltip.addEventListener('en-change', (event: Event) => {
          event.preventDefault(); tooltip.open = true;
        }, { signal: authority.signal });
      }
      document.getElementById('history-trigger')!.remove();
    }, mode);
    await expect.poll(() => page.evaluate(() => (window as any).overlayEvents.filter((event: any) => event.target === 'tooltip' && event.type === 'en-change' && event.proposed === false).length)).toBeGreaterThan(0);
    await expect(content).toBeVisible();
    await expect(page.locator('#tooltip')).toHaveJSProperty('open', true);
    await page.evaluate(() => {
      (window as any).cancelOverlayChanges = false;
      (window as any).tooltipAuthority.abort();
    });
    await page.keyboard.press('Escape');
    await expect(content).not.toBeVisible();
  });
}


for (const kind of ['dialog', 'popover'] as const) {
  test(`${kind}: an external native close reconciles silently before a queued render and can reopen`, async ({ page }) => {
    const host = page.locator(kind === 'dialog' ? '#dialog' : '#popover');
    const opener = page.getByRole('button', { name: kind === 'dialog' ? 'Open dialog' : 'Share options', exact: true });
    await opener.click();
    await expect(host).toHaveJSProperty('open', true);
    const surface = host.locator(kind === 'dialog' ? 'dialog' : '[popover]');
    await expect(surface).toBeVisible();
    const before = await page.evaluate(() => (window as any).overlayEvents.length);
    await host.evaluate(async (element: any, kind) => {
      const native = element.shadowRoot.querySelector(kind === 'dialog' ? 'dialog' : '[popover]');
      if (kind === 'dialog') native.close(); else native.hidePopover();
      element.requestUpdate();
      await element.updateComplete;
    }, kind);
    await expect(host).toHaveJSProperty('open', false);
    await expect(surface).not.toBeVisible();
    expect(await page.evaluate(() => (window as any).overlayEvents.length)).toBe(before);
    await host.evaluate((element: any) => { element.open = true; });
    await expect(surface).toBeVisible();
    await expect(host).toHaveAttribute('open', '');
    expect(await page.evaluate(() => (window as any).overlayEvents.length)).toBe(before);
  });
}
