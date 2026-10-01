import { css, html } from 'lit';
import { EnButton } from '@en-reve/elements/button.js';
import { EnTextField } from '@en-reve/elements/text-field.js';
import { EnNavigation } from '@en-reve/elements/navigation.js';
import { EnSegmentedControl } from '@en-reve/elements/segmented-control.js';
import { EnSegmentedItem } from '@en-reve/elements/segmented-item.js';

class StyleCascadeProbe extends EnButton {
	static styles = [...EnButton.styles, css`.en-button { border-top: 2px solid rgb(7, 9, 11); }`];
	render() {
		return html`${super.render()}<style data-consumer-style>.en-button { border-top: 7px solid rgb(13, 57, 91); }</style>`;
	}
}
class LinkCascadeProbe extends EnButton {
	static styles = [...EnButton.styles, css`.en-button { border-bottom: 2px solid rgb(7, 9, 11); }`];
	render() {
		return html`${super.render()}<link rel="stylesheet" href="/consumer-style.css">`;
	}
}

class FirstUpdatedStyleProbe extends EnButton {
	static styles = [...EnButton.styles, css`.en-button { border-left: 2px solid rgb(7, 9, 11); }`];
	firstUpdated(changed) {
		super.firstUpdated(changed);
		const style = this.ownerDocument.createElement('style');
		style.setAttribute('data-first-updated-style', '');
		style.textContent = '.en-button { border-left: 11px solid rgb(29, 61, 83); }';
		this.shadowRoot.append(style);
	}
}

export function registerFixture() {
	for (const [name, constructor] of [
		['en-button', EnButton], ['en-text-field', EnTextField], ['en-navigation', EnNavigation],
		['en-segmented-control', EnSegmentedControl], ['en-segmented-item', EnSegmentedItem],
		['en-adopted-style-probe', StyleCascadeProbe], ['en-adopted-link-probe', LinkCascadeProbe],
		['en-first-updated-style-probe', FirstUpdatedStyleProbe],
	]) if (!customElements.get(name)) customElements.define(name, constructor);
}

export function fixtureTemplate() {
	return html`<form id="style-form">
		<en-text-field id="field-a" label="Project title" name="title" value="Server title"></en-text-field>
		<en-text-field id="field-b" label="Project owner" name="owner" value="Studio"></en-text-field>
		<en-button id="button-a">Save title</en-button>
		<en-button id="button-b">Duplicate title</en-button>
	</form>
	<en-navigation id="native-nav" label="Project sections"><a id="owned-link" href="#native-content"><strong>Project</strong> content</a></en-navigation>
	<h2 id="native-content">Project content</h2>
	<en-segmented-control id="layout-choice" label="Layout" name="layout" form="style-form" value="grid">
		<en-segmented-item id="grid-label" value="grid"><strong id="rich-label">Grid</strong> layout</en-segmented-item>
		<en-segmented-item id="list-label" value="list">List layout</en-segmented-item>
	</en-segmented-control>
	<en-adopted-style-probe id="style-probe">Styled template</en-adopted-style-probe>
	<en-adopted-link-probe id="link-probe">Linked template</en-adopted-link-probe>
	<en-first-updated-style-probe id="first-updated-probe">Lifecycle style</en-first-updated-style-probe>
	<div id="fresh-elements"></div>`;
}
