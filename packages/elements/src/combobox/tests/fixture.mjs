const options = [
	{ value: 'forest', label: 'Forest canvas' },
	{ value: 'festival', label: 'Festival board', disabled: true },
	{ value: 'fjord', label: 'Fjord study' },
	{ value: 'sunset', label: 'Sunset study' },
];
const registeredBefore = customElements.get('en-combobox');
const { EnCombobox } = await import('@en-reve/elements/combobox.js');
const registeredAfterImport = customElements.get('en-combobox');
customElements.define('en-combobox', EnCombobox);
for (const host of document.querySelectorAll('en-combobox')) host.items = options;

const events = [];
const submissions = [];
const asset = document.querySelector('#asset');
const form = document.querySelector('#asset-form');
// Observe the removed request event only to detect accidental dual dispatch.
for (const type of ['en-input', 'en-request-change', 'en-change']) asset.addEventListener(type, event => {
	events.push({ type, detail: event.detail, value: asset.value, form: Object.fromEntries(new FormData(form)), cancelable: event.cancelable });
});
form.addEventListener('submit', event => {
	event.preventDefault();
	submissions.push(Object.fromEntries(new FormData(form)));
	document.querySelector('#submission').textContent = `Saved ${submissions.length} project${submissions.length === 1 ? '' : 's'}`;
});
window.comboboxFixture = {
	options, events, submissions,
	registeredBefore: Boolean(registeredBefore), registeredAfterImport: Boolean(registeredAfterImport),
	async settle() {
		for (let turn = 0; turn < 4; turn++) {
			await Promise.resolve();
			await Promise.all([...document.querySelectorAll('en-combobox')].map(host => host.updateComplete));
		}
	},
};
await window.comboboxFixture.settle();
document.body.dataset.ready = 'true';
