import { test, expect } from '@playwright/test';

for (const backend of ['token', 'rich']) {
  test(`${backend} plane edits preserve P3 and alpha with one Apply undo step`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/api-examples/color-picker.html');
    const editor = page.locator(`#color-${backend}-editor`);
    const box = editor.getByRole('textbox');
    await expect(box).toHaveAttribute('contenteditable', 'true');
    await box.focus(); await box.pressSequentially('#');
    const dialog = editor.getByRole('dialog', { name: 'Color picker' });
    const picker = dialog.locator('en-color-picker');
    await expect(picker.locator('en-color-plane')).toBeVisible();
    const original = await picker.evaluate((el: any) => el.value);
    const hue = picker.getByRole('slider', { name: 'Hue', exact: true });
    await hue.focus(); await hue.press('ArrowRight'); await hue.press('ArrowRight');
    const chosen = await picker.evaluate((el: any) => el.value);
    expect(chosen).not.toBe(original);
    expect(chosen).toMatch(/^color\(display-p3 .* \/ 0\.65\)$/);
    await dialog.getByRole('button', { name: 'Apply color', exact: true }).click();
    await expect(dialog).not.toBeVisible();
    await expect(editor).toHaveJSProperty('value', chosen);
    const chip = box.locator('[data-token]');
    await expect(chip).toHaveCount(1);
    const id = await chip.getAttribute('data-token');
    await chip.click();
    await expect(picker).toHaveJSProperty('value', chosen);
    const saturation = picker.getByRole('slider', { name: 'Saturation', exact: true });
    await saturation.focus(); await saturation.press('Home');
    await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(editor).toHaveJSProperty('value', chosen);
    await chip.click();
    await saturation.focus(); await saturation.press('Home');
    await dialog.getByRole('button', { name: 'Apply color', exact: true }).click();
    await expect(chip).toHaveAttribute('data-token', id!);
    await editor.evaluate((el: any) => el.undo());
    await expect(editor).toHaveJSProperty('value', chosen);
    await editor.evaluate((el: any) => el.undo());
    await expect(editor).toHaveJSProperty('value', '#');
    expect(errors).toEqual([]);
  });

  test(`${backend} plane popup fits narrow RTL and keeps invalid numeric drafts uncommitted`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/api-examples/color-picker.html');
    const editor = page.locator(`#color-${backend}-editor`);
    const box = editor.getByRole('textbox');
    await expect(box).toHaveAttribute('contenteditable', 'true');
    await editor.evaluate(el => el.setAttribute('dir', 'rtl'));
    await box.focus(); await box.pressSequentially('#');
    const dialog = editor.getByRole('dialog', { name: 'Color picker' });
    const picker = dialog.locator('en-color-picker');
    await expect(picker.locator('en-color-plane')).toBeVisible();
    const field = picker.getByRole('textbox', { name: /^Saturation / });
    await field.fill('120'); await field.press('Enter');
    await dialog.getByRole('button', { name: 'Apply color', exact: true }).click();
    await expect(dialog).toBeVisible();
    await expect(box.locator('[data-token]')).toHaveCount(0);
    expect(await picker.evaluate((el: any) => el.checkValidity())).toBe(false);
    await field.fill('50'); await field.press('Enter');
    expect(await picker.evaluate((el: any) => el.checkValidity())).toBe(true);
    const bounds = await dialog.boundingBox();
    expect(bounds!.x).toBeGreaterThanOrEqual(-1);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(391);
    expect(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    await dialog.getByRole('button', { name: 'Apply color', exact: true }).click();
    await expect(box.locator('[data-token]')).toHaveCount(1);
  });
}

test('plane equivalents remain readable and fit across inspired themes', async ({ page }) => {
  test.setTimeout(60_000);
  await page.setViewportSize({width:390,height:844});
  await page.goto('/api-examples/color-picker.html');
  const picker=page.locator('#wide-picker');
  for(const theme of ['spectrum','fluent','astryx','shadcn','holotable']) {
    await page.getByRole('combobox',{name:'Inspired theme',exact:true}).selectOption(`${theme}-inspired`);
    await expect(page.getByRole('status',{name:'Theme result'})).toContainText('applied');
    for(const mode of ['light','dark']) {
      await page.getByRole('combobox',{name:'Appearance',exact:true}).selectOption(mode);
      await expect(picker.getByRole('slider')).toHaveCount(4);
      await expect(picker.getByRole('textbox')).toHaveCount(4);
      const width=await picker.evaluate(el=>el.getBoundingClientRect().width);
      expect(width).toBeLessThanOrEqual(390);
      expect(await picker.evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
      const snapshot=await picker.ariaSnapshot();
      for(const name of ['Hue','Saturation','Value','Alpha'])expect(snapshot).toContain(`slider "${name}"`);
    }
  }
});
