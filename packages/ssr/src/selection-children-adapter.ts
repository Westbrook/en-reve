import {EnSelectionCollection} from '@en-reve/elements/selection-collection.js';
import {EnToggleGroup} from '@en-reve/elements/toggle-group.js';
import {EnCheckboxGroup} from '@en-reve/elements/checkbox-group.js';
import {EnMultiselect} from '@en-reve/elements/multiselect.js';
import { EnElementRenderer } from './en-element-renderer.js';
import type { ElementRendererConstructor } from '@lit-labs/ssr/lib/element-renderer.js';
import { collectResult } from '@lit-labs/ssr/lib/render-result.js';
import type { ThunkedRenderResult } from '@lit-labs/ssr/lib/render-result.js';
import type { RenderInfo } from '@lit-labs/ssr/lib/render.js';
import { parseFragment } from 'parse5';
import {restore, copyContext, isElement, attribute, walk, textContent, projectionEdits, type TreeElement, type Edit} from './internal/buffered-projection.js';
import { EnSelect } from '@en-reve/elements/select.js';
import { EnSegmentedControl } from '@en-reve/elements/segmented-control.js';
import {
	SELECTION_CHILDREN_ATTRIBUTE,
	SELECTION_SLOT_PREFIX,
	normalizeSelectionChildren,
  checkboxContent,
	isSelectionLabelInteractive,
	isGeneratedSelectionSlot,
	prepareSelectionChildren,
} from '@en-reve/primitives/interactions/selection-children.js';
import type { SelectionChildKind, SelectionChildrenPlan, SelectionContentNode } from '@en-reve/primitives/interactions/selection-children.js';

const {insertAttribute, applyEdits} = projectionEdits('Selection-child SSR');
const MARKER_PREFIX = 'en-selection-ssr:';
const HTML_NAMESPACE = 'http://www.w3.org/1999/xhtml';
type ChoiceElement = EnSelect | EnSegmentedControl | EnToggleGroup | EnCheckboxGroup | EnMultiselect | EnSelectionCollection;
type Capture = Readonly<Record<string, unknown>>;
interface Boundary {
	readonly marker: string;
	readonly kind: SelectionChildKind;
	readonly tagName: string;
	readonly value: string;
	render(plan: SelectionChildrenPlan): Promise<string>;
}

/** Internal, request-local buffered adapter; callers author children, never plans or duplicate item arrays. */
export function createSelectionChildrenSsrAdapter(): {
	readonly Renderer: ElementRendererConstructor;
	finalize(markup: string): Promise<string>;
} {
	const records: Boundary[] = [];
	let nonce: string | undefined;
	let phase: 'rendering' | 'finalizing' | 'finished' = 'rendering';
	const requireRendering = (): void => {
		if (phase !== 'rendering') throw new Error('Selection-child SSR is single-use; create a new adapter per response.');
	};
	class SelectionChildrenRenderer extends EnElementRenderer {
		static override matchesClass(ctor: typeof HTMLElement, tagName?: string): boolean {
			return (ctor === EnSelect && tagName === 'en-select')
				|| (ctor === EnSegmentedControl && tagName === 'en-segmented-control')
        || (ctor === EnToggleGroup && tagName === 'en-toggle-group') || (ctor === EnCheckboxGroup && tagName === 'en-checkbox-group') || (ctor === EnMultiselect && tagName === 'en-multiselect') || (ctor === EnSelectionCollection && tagName === 'en-selection-collection');
		}
		override renderShadow(info: RenderInfo): ThunkedRenderResult {
			requireRendering();
			const element = this.element as ChoiceElement;
			const kind: SelectionChildKind = element instanceof EnSelect ? 'select' : element instanceof EnSegmentedControl ? 'segmented' : element instanceof EnCheckboxGroup ? 'checkbox' : 'choice';
			const tagName = element instanceof EnSelectionCollection ? 'en-selection-collection' : element instanceof EnToggleGroup ? 'en-toggle-group' : element instanceof EnCheckboxGroup ? 'en-checkbox-group' : element instanceof EnMultiselect ? 'en-multiselect' : kind === 'select' ? 'en-select' : 'en-segmented-control';
			const snapshot = capture(element);
			const context = copyContext(info);
			nonce ??= globalThis.crypto.randomUUID();
			const marker = `${MARKER_PREFIX}${nonce}:${records.length}`;
			records.push({ marker, kind, tagName, value: kind === 'choice' || kind === 'checkbox' ? JSON.stringify(snapshot.value ?? []) : String(snapshot.value ?? ''), render: async plan => {
				restore(element, snapshot);
				prepareSelectionChildren(element, plan);
				const rendered = super.renderShadow(copyContext(context));
				if (rendered === undefined) throw new Error('Selection-child SSR cannot finalize a component with SSR disabled.');
				return collectResult(rendered);
			} });
			// An actual placeholder result preserves Lit's host-stack bookkeeping.
			return [`<!--${marker}-->`];
		}
	}
	return {
		Renderer: SelectionChildrenRenderer,
		async finalize(markup): Promise<string> {
			requireRendering(); phase = 'finalizing';
			try {
				if (!records.length) return markup;
				const document = parseFragment(markup, { sourceCodeLocationInfo: true });
				const byMarker = new Map(records.map(record => [record.marker, record]));
				const matches: { host: TreeElement; template: TreeElement; record: Boundary }[] = [];
				walk(document, node => {
					if (!isElement(node) || node.namespaceURI !== HTML_NAMESPACE || !['en-select', 'en-segmented-control', 'en-toggle-group', 'en-checkbox-group', 'en-multiselect', 'en-selection-collection'].includes(node.tagName)) return;
					for (const child of node.childNodes) {
						if (!isElement(child) || child.tagName !== 'template' || !('content' in child)) continue;
						const content = child.content.childNodes;
						if (content.length !== 1 || content[0].nodeName !== '#comment' || !('data' in content[0])) continue;
						const marker = content[0].data;
						if (!marker.startsWith(MARKER_PREFIX)) continue;
						const record = byMarker.get(marker);
						if (!record || record.tagName !== node.tagName) throw new Error('Selection-child SSR placeholder is repeated or belongs to another response.');
						if (attribute(child, 'shadowrootmode') !== 'open') throw new Error('Selection-child SSR requires its original open DSD root.');
						byMarker.delete(marker); matches.push({ host: node, template: child, record });
					}
				});
				if (byMarker.size) throw new Error('Selection-child SSR output is incomplete or belongs to another response.');
				const edits: Edit[] = [];
				for (const { host, template, record } of matches) {
					if (attribute(host, SELECTION_CHILDREN_ATTRIBUTE) !== undefined) throw new Error(`Selection-child SSR reserves ${SELECTION_CHILDREN_ATTRIBUTE}; omit authored metadata.`);
					const children = sourceChildren(host, template, record.kind);
					const items = normalizeSelectionChildren(record.kind, children.map((child, index) => ({
						key: `ssr-${index}`, tagName: child.tagName,
						attributes: Object.fromEntries(child.attrs.filter(attr => !attr.namespace).map(attr => [attr.name, attr.value])),
						text: record.kind === 'checkbox' ? checkboxContent(child.childNodes.map(contentNode)).label : textContent(child),
            description: record.kind === 'checkbox' ? checkboxContent(child.childNodes.map(contentNode)).description : undefined,
            descriptionAssigned: record.kind === 'checkbox' ? checkboxContent(child.childNodes.map(contentNode)).descriptionAssigned : undefined, interactive: containsInteractive(child),
					})));
					const plan: SelectionChildrenPlan = { version: 1, kind: record.kind, value: record.value, items };
					if (children.length) {
						edits.push(insertAttribute(markup, host, SELECTION_CHILDREN_ATTRIBUTE, JSON.stringify(plan)));
						if (record.kind === 'segmented' || record.kind === 'checkbox') children.forEach((child, index) => {
							edits.push(assignSelectionSlot(markup, child, `${SELECTION_SLOT_PREFIX}${items[index]!.key}`));
						});
					}
					const location = template.sourceCodeLocation;
					if (!location?.startTag || !location.endTag) throw new Error('Selection-child SSR requires a complete DSD template.');
					edits.push({ start: location.startTag.endOffset, end: location.endTag.startOffset, replacement: await record.render(plan) });
				}
				return applyEdits(markup, edits);
			} finally { phase = 'finished'; records.length = 0; }
		},
	};
}

/** Capture every public value read by these fields' canonical templates before deferred rendering. */
function capture(element: ChoiceElement): Capture {
	const fields = ['value', 'size', 'label', 'description', 'name', 'disabled', 'required', 'readOnly', 'multiple', 'allowEmpty', 'cards', 'orientation', 'error',
		...(element instanceof EnSelect ? ['placeholder', 'error'] : ['validationText'])];
	return Object.freeze({ ...Object.fromEntries(fields.map(name => [name, Reflect.get(element, name)])),
		items: Array.isArray(element.items) ? Object.freeze(element.items.map(item => Object.freeze({ ...item }))) : element.items,
	});
}
function sourceChildren(host: TreeElement, _placeholder: TreeElement, kind: SelectionChildKind): TreeElement[] {
	const descriptor = kind === 'select' ? 'en-select-option' : kind === 'choice' || kind === 'checkbox' ? 'en-choice-option' : 'en-segmented-item';
	// Match the browser controller's recognized direct-child boundary. Other
	// content keeps its authored bytes and ordinary named-slot semantics.
	return host.childNodes.filter((child): child is TreeElement => isElement(child)
		&& child.namespaceURI === HTML_NAMESPACE && child.tagName === descriptor);
}

// The shared projection constraint is not an arbitrary HTML sanitizer.
function containsInteractive(node: TreeElement): boolean {
	return node.childNodes.some(child => isElement(child) && (
		isSelectionLabelInteractive(child.tagName, Object.fromEntries(child.attrs.map(attr => [attr.name, attr.value])))
		|| containsInteractive(child)
	));
}
/** Pasted internal metadata is replaced, never trusted as this response's identity. */
function assignSelectionSlot(markup: string, element: TreeElement, value: string): Edit {
	const previous = attribute(element, 'slot');
	if (previous === undefined) return insertAttribute(markup, element, 'slot', value);
	if (!isGeneratedSelectionSlot(previous)) throw new Error('Selection-child SSR cannot replace an authored slot.');
	const location = element.sourceCodeLocation?.attrs?.slot;
	if (!location) throw new Error('Selection-child SSR requires the original generated slot location.');
	return { start: location.startOffset, end: location.endOffset, replacement: `slot="${value}"` };
}

function contentNode(node: import('./internal/buffered-projection.js').TreeNode): SelectionContentNode {
  if (isElement(node)) return {attributes: Object.fromEntries(node.attrs.map(a => [a.name,a.value])), children: node.childNodes.map(contentNode)};
  return node.nodeName === '#text' && 'value' in node ? {text: node.value} : {};
}
