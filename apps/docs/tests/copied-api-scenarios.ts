import { expect, type Page } from '@playwright/test';

/** Consumer journeys for the complete copied modules, without the docs shell.
 * Owning suites retain their broader SSR, theme, accessibility and API matrices.
 * These journeys exercise the examples' own handlers, not replacement fixtures.
 */
export const copiedAPIScenarios: Array<{
	id: string;
	entry: string;
	contract: string;
	run(page: Page): Promise<void>;
}> = [
	{
		id: 'api-calendar', entry: 'calendarExample',
		contract: 'Keyboard navigation, canceled selection, accepted FormData and picker focus recovery',
		async run(page) {
			const calendar = page.locator('#specimen-calendar');
			const date = (value: string) => calendar.locator(`button[data-date="${value}"]`);
			await date('2026-09-18').focus();
			await date('2026-09-18').press('ArrowRight');
			await expect(date('2026-09-19')).toBeFocused();
			await expect(calendar).toHaveJSProperty('value', '2026-09-18');
			await calendar.evaluate(element => element.addEventListener('en-change', event => event.preventDefault(), { once: true }));
			await date('2026-09-19').press('Enter');
			await expect(calendar).toHaveJSProperty('value', '2026-09-18');
			await date('2026-09-19').press('Enter');
			await expect(calendar).toHaveJSProperty('value', '2026-09-19');
			const picker = page.locator('#specimen-date-picker');
			const trigger = picker.locator('#picker-trigger').getByRole('button');
			await trigger.click();
			await expect(picker.locator('button[data-date="2026-09-18"]')).toBeFocused();
			await picker.locator('button[data-date="2026-09-22"]').click();
			await expect(picker).toHaveJSProperty('value', '2026-09-22');
			await expect(picker.locator('en-dialog')).toHaveJSProperty('open', false);
			await expect(trigger).toBeFocused();
			expect(await picker.evaluate(element => new FormData(element.closest('form')!).get(element.getAttribute('name')!))).toBe('2026-09-22');
		},
	},
	{
		id: 'api-carousel', entry: 'carouselExample',
		contract: 'Bounded keyed slides, distant reveal, thumbnail activation and canceled navigation',
		async run(page) {
			const carousel = page.locator('#large-carousel');
			await expect(carousel).toHaveJSProperty('currentKey', 'study-1');
			await page.getByRole('button', { name: 'Go to study 500', exact: true }).click();
			await expect(carousel).toHaveJSProperty('currentKey', 'study-500');
			await expect(carousel.getByRole('link', { name: 'Explore Study 500', exact: true })).toBeVisible();
			await expect.poll(() => carousel.locator('.collection-slide').count()).toBeLessThan(12);
			await expect.poll(() => carousel.locator('.picker-button').count()).toBeLessThan(20);
			const thumbnail = carousel.locator('.picker-button').last();
			const target = Number(await thumbnail.getAttribute('data-index')) + 1;
			await thumbnail.click({ delay: 60 });
			await expect(carousel).toHaveJSProperty('currentKey', `study-${target}`);
			await expect(carousel.locator(`.picker-button[data-index="${target - 1}"]`)).toHaveAttribute('aria-current', 'true');
			await carousel.evaluate(element => element.addEventListener('en-change', event => event.preventDefault(), { once: true }));
			await carousel.getByRole('button', { name: 'Next slide', exact: true }).click();
			await expect(carousel).toHaveJSProperty('currentKey', `study-${target}`);
			await carousel.getByRole('button', { name: 'Next slide', exact: true }).click();
			await expect(carousel).toHaveJSProperty('currentKey', `study-${target + 1}`);
		},
	},
	{
		id: 'api-chat-patterns', entry: 'chatPatternsExample',
		contract: 'Attachment send failure, local retry and preservation of a newer draft',
		async run(page) {
			const demo = page.locator('[data-chat-patterns-demo]');
			const editor = demo.getByRole('textbox', { name: 'Message', exact: true });
			await editor.fill('Please review');
			await demo.locator('input[type=file]').setInputFiles({ name: 'study.pdf', mimeType: 'application/pdf', buffer: Buffer.from('local fixture') });
			await demo.getByRole('button', { name: 'Send message', exact: true }).click();
			await demo.getByRole('button', { name: 'Fail send', exact: true }).click();
			const message = demo.locator('en-chat-message').last();
			await expect(message).toContainText('Not sent');
			await expect(editor).toHaveValue('Please review');
			await editor.fill('Newer draft');
			await message.getByRole('button', { name: 'Retry message', exact: true }).click();
			await expect(message).toContainText('Retrying');
			await demo.getByRole('button', { name: 'Complete send', exact: true }).click();
			await expect(message).toContainText('Sent locally');
			await expect(message).toContainText('study.pdf');
			await expect(demo.locator('en-chat-message')).toHaveCount(2);
			await expect(editor).toHaveValue('Newer draft');
		},
	},
	{
		id: 'api-multi-step', entry: 'multiStepExample',
		contract: 'Validation summary, step navigation, failed-save recovery and retained form data',
		async run(page) {
			const demo = page.locator('[data-multi-step]');
			await demo.getByRole('button', { name: 'Continue', exact: true }).click();
			await expect(demo.locator('en-validation-summary').getByRole('region')).toBeFocused();
			await demo.locator('en-validation-summary').getByRole('link', { name: 'Enter a project name.', exact: true }).click();
			const title = demo.getByRole('textbox', { name: 'Project name', exact: true });
			await expect(title).toBeFocused();
			await title.fill('Independent brief');
			await demo.getByRole('textbox', { name: 'Work email', exact: true }).fill('review@example.com');
			await demo.getByRole('button', { name: 'Continue', exact: true }).click();
			await expect(demo.getByRole('heading', { name: 'Step 2 of 3: Review date' })).toBeFocused();
			await demo.getByRole('button', { name: 'Continue', exact: true }).click();
			await expect(demo.getByRole('heading', { name: 'Step 3 of 3: Confirm brief' })).toBeFocused();
			await expect(demo.locator('dd').first()).toHaveText('Independent brief');
			await demo.getByRole('button', { name: 'Create brief', exact: true }).click();
			await expect(demo.locator('[data-save-error]')).toBeFocused();
			await demo.getByText('Review scenarios', { exact: true }).click();
			await demo.getByRole('checkbox', { name: 'Simulate save failure', exact: true }).uncheck();
			await demo.getByRole('button', { name: 'Try again', exact: true }).click();
			await expect(demo.getByRole('heading', { name: 'Project brief created' })).toBeFocused();
			await expect(demo.getByRole('status')).toContainText('No information was sent');
		},
	},
	{
		id: 'api-presence-activity', entry: 'presenceActivityExample',
		contract: 'Presence overflow and activity load veto, failure, retry and appended content',
		async run(page) {
			const demo = page.locator('[data-presence-activity-demo]');
			const group = demo.locator('en-presence-group');
			await group.getByRole('button', { name: 'Show 2 more collaborators', exact: true }).click();
			await expect(group.locator('en-presence').last()).toBeVisible();
			const feed = demo.locator('#activity-feed-example');
			const older = feed.getByRole('button', { name: 'Load older activity', exact: true });
			await feed.evaluate(element => element.addEventListener('en-action', event => event.preventDefault(), { once: true }));
			await older.click();
			await expect(feed).toHaveJSProperty('loading', false);
			await older.click();
			await expect(feed).toHaveJSProperty('loading', true);
			await expect(feed.getByRole('listitem')).toHaveCount(2);
			await demo.getByRole('button', { name: 'Fail load', exact: true }).click();
			await feed.getByRole('button', { name: 'Retry older activity', exact: true }).click();
			await demo.getByRole('button', { name: 'Complete load', exact: true }).click();
			await expect(demo.getByRole('list', { name: 'September 14 project activity', exact: true })).toBeVisible();
			await expect(feed).toHaveJSProperty('loading', false);
		},
	},
	{
		id: 'api-rich-text', entry: 'richTextExample',
		contract: 'Reference insertion, retained trigger text, cancellation and composer submission',
		async run(page) {
			const editor = page.locator('#rich-reply');
			const field = editor.getByRole('textbox');
			await field.click();
			await field.pressSequentially('@Cov');
			await expect(editor.getByRole('option', { name: 'Cover study', exact: true })).toBeVisible();
			await field.press('Enter');
			await expect(editor).toHaveJSProperty('value', '@Cover study');
			await expect(editor.locator('[part~="token-content"]')).toHaveText('@Cover study');
			await field.press('End');
			await field.pressSequentially(' /rev');
			await expect(editor.getByRole('option', { name: 'Review tool', exact: true })).toBeVisible();
			await field.press('Escape');
			await expect(editor.getByRole('option')).toHaveCount(0);
			await expect(editor).toHaveJSProperty('value', '@Cover study /rev');
			await page.getByRole('button', { name: 'Send message', exact: true }).click();
			await expect(page.getByRole('status', { name: 'Editor result', exact: true })).toContainText('@Cover study /rev');
		},
	},
	{
		id: 'api-toast', entry: 'toastExample',
		contract: 'Actionable notification, native keyboard order, retry outcome and focus recovery',
		async run(page) {
			const demo = page.locator('[data-toast-demo]');
			const region = demo.locator('en-toast-region[label="Demo notifications"]');
			await demo.getByRole('button', { name: 'Simulate failed upload', exact: true }).click();
			const toast = region.locator('en-toast').last();
			await expect(toast).toHaveJSProperty('messageText', 'Upload failed. Your file is still available.');
			await expect(region.getByRole('status')).toHaveText('Upload failed. Your file is still available.');
			const retry = toast.getByRole('button', { name: 'Retry upload', exact: true });
			const details = toast.getByRole('button', { name: 'View details', exact: true });
			await retry.focus();
			await page.keyboard.press('Tab');
			await expect(details).toBeFocused();
			await details.press('Enter');
			await expect(demo.locator('[data-toast-log]')).toContainText('the simulated connection was interrupted');
			await expect(toast).toHaveJSProperty('open', true);
			await retry.focus();
			await retry.press('Enter');
			await expect(demo.locator('[data-toast-log]')).toContainText('Upload retry succeeded locally.');
			await expect(region.locator('en-toast').nth(1)).toHaveJSProperty('open', false);
			await expect(region.locator('en-toast').last()).toHaveJSProperty('messageText', 'Upload completed.');
			await expect(region.getByRole('region', { name: 'Demo notifications', exact: true })).toBeFocused();
		},
	},
	{
		id: 'api-tree-data', entry: 'treeDataExample',
		contract: 'Distant virtual reveal, selection and collapse/expand preserving the selected key',
		async run(page) {
			const tree = page.locator('#specimen-tree-data');
			await expect.poll(() => tree.getByRole('treeitem').count()).toBeGreaterThan(0);
			await expect.poll(() => tree.getByRole('treeitem').count()).toBeLessThan(100);
			await page.getByText('Scroll to an item', { exact: true }).click();
			await page.getByRole('button', { name: 'Scroll to item', exact: true }).click();
			const item = tree.locator('[role="treeitem"][data-en-tree-key="asset-10-025"]');
			await expect(item).toBeInViewport();
			await expect(page.locator('[data-tree-data-status]')).toContainText('Selection and focus are unchanged');
			await expect(tree).toHaveJSProperty('selectedKey', '');
			await item.click();
			await expect(tree).toHaveJSProperty('selectedKey', 'asset-10-025');
			await page.getByRole('button', { name: 'Collapse all collections', exact: true }).click();
			await expect(item).toHaveCount(0);
			await expect(tree).toHaveJSProperty('selectedKey', 'asset-10-025');
			await page.getByRole('button', { name: 'Expand all collections', exact: true }).click();
			await page.getByRole('button', { name: 'Scroll to item', exact: true }).click();
			await expect(item).toHaveAttribute('aria-selected', 'true');
		},
	},
	{
		id: 'api-virtual-collection', entry: 'virtualCollectionExample',
		contract: 'Distant virtual reveal, selection and removing the selected record through authored controls',
		async run(page) {
			const demo = page.locator('en-virtual-collection-demo');
			const rows = demo.locator('[data-en-virtual-key], [data-record]');
			await expect.poll(() => rows.count()).toBeGreaterThan(0);
			await expect.poll(() => rows.count()).toBeLessThan(100);
			await demo.locator('details.scroll-demo > summary').click();
			await demo.getByRole('textbox', { name: 'Asset key', exact: true }).fill('asset-05000');
			await demo.getByRole('button', { name: 'Show asset', exact: true }).click();
			const row = demo.locator('[data-en-virtual-key="asset-05000"], [data-record="asset-05000"]');
			await expect(row).toBeInViewport();
			await row.getByRole('checkbox', { name: 'Select Asset 05000', exact: true }).check();
			await expect(demo.locator('[data-selection-status]')).toHaveText('1 selected · 10,000 records');
			await demo.getByRole('button', { name: 'Remove selected', exact: true }).click();
			await expect(row).toHaveCount(0);
			await expect(demo.locator('[data-selection-status]')).toHaveText('0 selected · 9,999 records');
			await expect.poll(() => rows.count()).toBeLessThan(100);
		},
	},
];
