import { expect, test } from '@playwright/test';

const path = '/api-examples/virtual-collection.html?progress-report';

for (const width of [1440, 390]) {
	for (const presentation of ['list', 'table'] as const) {
		test(`distant native smooth ${presentation} at ${width}px reveal keeps the visible window rendered`, async ({ page }, info) => {
			await page.setViewportSize({ width, height: 1000 });
			await page.emulateMedia({ reducedMotion: 'no-preference' });
			await page.goto(path);
			await expect(page.locator('en-api-example-app')).not.toHaveAttribute('data-ssr');
			const demo = page.locator('en-virtual-collection-demo');
			await demo.getByRole('combobox', { name: 'Presentation', exact: true }).selectOption(presentation);
			const first = demo.locator('[data-en-virtual-key="asset-00001"]');
			await expect(first).toBeVisible();
			const selection = first.getByRole('checkbox');
			await selection.focus();
			await selection.press('Space');
			const observations = await demo.evaluate(async (node: any) => {
				const viewport = node.presentation === 'table' ? node.shadowRoot.querySelector('en-table').scrollElement : node.shadowRoot.querySelector('[data-virtual-viewport]');
				const sample = () => {
					const bounds = viewport.getBoundingClientRect();
					const insets = node.presentation === 'table' ? node.shadowRoot.querySelector('en-table').scrollInsets : { blockStart: 0, blockEnd: 0 };
					const top = bounds.top + viewport.clientTop + insets.blockStart;
					const bottom = bounds.top + viewport.clientTop + viewport.clientHeight - insets.blockEnd;
					const rows = [...node.shadowRoot.querySelectorAll('[data-en-virtual-key]')] as HTMLElement[];
					return { position: viewport.scrollTop, mounted: rows.length, visible: rows.filter(row => {
						const box = row.getBoundingClientRect(); return box.bottom > top + 1 && box.top < bottom - 1;
					}).map(row => row.dataset.enVirtualKey) };
				};
				const phases = [];
				for (const key of ['asset-09000', 'asset-00001']) {
					const frames = [];
					const accepted = node.controller.scrollToKey(key, { behavior: 'smooth', container: 'nearest' });
					for (let index = 0; index < 240; index++) {
						await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
						await node.updateComplete;
						frames.push(sample());
						if (frames.length >= 12 && frames.at(-1)!.visible.includes(key)
							&& frames.slice(-12).every(frame => Math.abs(frame.position - frames.at(-1)!.position) < 1)) break;
					}
					phases.push({ key, accepted, frames });
				}
				return phases;
			});
			await info.attach('distant-smooth-coverage', { body: JSON.stringify(observations), contentType: 'application/json' });
			for (const phase of observations) {
				expect(phase.accepted).toBe(true);
				expect(new Set(phase.frames.map(frame => Math.round(frame.position))).size).toBeGreaterThan(3);
				expect(phase.frames.filter(frame => frame.visible.length === 0)).toEqual([]);
				expect(Math.max(...phase.frames.map(frame => frame.mounted))).toBeLessThan(80);
				expect(phase.frames.at(-1)!.visible).toContain(phase.key);
			}
			await expect(selection).toBeFocused();
			await expect(selection).toBeChecked();
			await expect(first).toBeInViewport();
		});
	}
}
