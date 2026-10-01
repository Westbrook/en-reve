import { EnElementRenderer } from './en-element-renderer.js';
import type { ElementRendererConstructor } from '@lit-labs/ssr/lib/element-renderer.js';
import { collectResult } from '@lit-labs/ssr/lib/render-result.js';
import type { ThunkedRenderResult } from '@lit-labs/ssr/lib/render-result.js';
import type { RenderInfo } from '@lit-labs/ssr/lib/render.js';
import { parseFragment } from 'parse5';
import {restore, copyContext, isElement, attribute, walk, textContent, projectionEdits, type TreeElement, type Edit} from './internal/buffered-projection.js';
import { EnProgressSteps } from '@en-reve/elements/progress-steps.js';
import { EnValidationSummary } from '@en-reve/elements/validation-summary.js';
import {
	FORM_CHILDREN_ATTRIBUTE,
	FORM_SLOT_PREFIX,
	normalizeFormChildren,
	isFormLabelInteractive,
	isGeneratedFormSlot,
	prepareFormChildren,
} from '@en-reve/primitives/interactions/form-children.js';
import type { FormChildKind, FormChildrenPlan } from '@en-reve/primitives/interactions/form-children.js';

const {insertAttribute, applyEdits} = projectionEdits('Form-child SSR');
const MARKER_PREFIX = 'en-form-ssr:';
const HTML_NAMESPACE = 'http://www.w3.org/1999/xhtml';
type ChoiceElement = EnProgressSteps | EnValidationSummary;
type Capture = Readonly<Record<string, unknown>>;
interface Boundary {
	readonly marker: string;
	readonly kind: FormChildKind;
	readonly tagName: string;
	readonly value: string;
	render(plan: FormChildrenPlan): Promise<string>;
}

/** Internal, request-local buffered adapter; callers author children, never plans or duplicate item arrays. */
export function createFormChildrenSsrAdapter(): {
	readonly Renderer: ElementRendererConstructor;
	finalize(markup: string): Promise<string>;
} {
	const records: Boundary[] = [];
	let nonce: string | undefined;
	let phase: 'rendering' | 'finalizing' | 'finished' = 'rendering';
	const requireRendering = (): void => {
		if (phase !== 'rendering') throw new Error('Form-child SSR is single-use; create a new adapter per response.');
	};
	class FormChildrenRenderer extends EnElementRenderer {
		static override matchesClass(ctor: typeof HTMLElement, tagName?: string): boolean {
			return (ctor === EnProgressSteps && tagName === 'en-progress-steps')
				|| (ctor === EnValidationSummary && tagName === 'en-validation-summary');
		}
		override renderShadow(info: RenderInfo): ThunkedRenderResult {
			requireRendering();
			const element = this.element as ChoiceElement;
			const kind: FormChildKind = element instanceof EnProgressSteps ? 'steps' : 'errors';
			const tagName = kind === 'steps' ? 'en-progress-steps' : 'en-validation-summary';
			const snapshot = capture(element);
			const context = copyContext(info);
			nonce ??= globalThis.crypto.randomUUID();
			const marker = `${MARKER_PREFIX}${nonce}:${records.length}`;
			records.push({ marker, kind, tagName, value: String(snapshot.value ?? ''), render: async plan => {
				restore(element, snapshot);
				prepareFormChildren(element, plan);
				const rendered = super.renderShadow(copyContext(context));
				if (rendered === undefined) throw new Error('Form-child SSR cannot finalize a component with SSR disabled.');
				return collectResult(rendered);
			} });
			// An actual placeholder result preserves Lit's host-stack bookkeeping.
			return [`<!--${marker}-->`];
		}
	}
	return {
		Renderer: FormChildrenRenderer,
		async finalize(markup): Promise<string> {
			requireRendering(); phase = 'finalizing';
			try {
				if (!records.length) return markup;
				const document = parseFragment(markup, { sourceCodeLocationInfo: true });
				const byMarker = new Map(records.map(record => [record.marker, record]));
				const matches: { host: TreeElement; template: TreeElement; record: Boundary }[] = [];
				walk(document, node => {
					if (!isElement(node) || node.namespaceURI !== HTML_NAMESPACE || !['en-progress-steps', 'en-validation-summary'].includes(node.tagName)) return;
					for (const child of node.childNodes) {
						if (!isElement(child) || child.tagName !== 'template' || !('content' in child)) continue;
						const content = child.content.childNodes;
						if (content.length !== 1 || content[0].nodeName !== '#comment' || !('data' in content[0])) continue;
						const marker = content[0].data;
						if (!marker.startsWith(MARKER_PREFIX)) continue;
						const record = byMarker.get(marker);
						if (!record || record.tagName !== node.tagName) throw new Error('Form-child SSR placeholder is repeated or belongs to another response.');
						if (attribute(child, 'shadowrootmode') !== 'open') throw new Error('Form-child SSR requires its original open DSD root.');
						byMarker.delete(marker); matches.push({ host: node, template: child, record });
					}
				});
				if (byMarker.size) throw new Error('Form-child SSR output is incomplete or belongs to another response.');
				const edits: Edit[] = [];
				for (const { host, template, record } of matches) {
					if (attribute(host, FORM_CHILDREN_ATTRIBUTE) !== undefined) throw new Error(`Form-child SSR reserves ${FORM_CHILDREN_ATTRIBUTE}; omit authored metadata.`);
					const children = sourceChildren(host, template, record.kind);
					const items = normalizeFormChildren(record.kind, children.map((child, index) => ({
						key: `ssr-${index}`, tagName: child.tagName,
						attributes: Object.fromEntries(child.attrs.filter(attr => !attr.namespace).map(attr => [attr.name, attr.value])),
						text: textContent(child), interactive: containsInteractive(child),
					})));
					const plan: FormChildrenPlan = { version: 1, kind: record.kind, value: record.value, items };
					if (children.length) {
						edits.push(insertAttribute(markup, host, FORM_CHILDREN_ATTRIBUTE, JSON.stringify(plan)));
						children.forEach((child, index) => {
							edits.push(assignSelectionSlot(markup, child, `${FORM_SLOT_PREFIX}${items[index]!.key}`));
						});
					}
					const location = template.sourceCodeLocation;
					if (!location?.startTag || !location.endTag) throw new Error('Form-child SSR requires a complete DSD template.');
					edits.push({ start: location.startTag.endOffset, end: location.endTag.startOffset, replacement: await record.render(plan) });
				}
				return applyEdits(markup, edits);
			} finally { phase = 'finished'; records.length = 0; }
		},
	};
}

/** Capture every public value read by these fields' canonical templates before deferred rendering. */
function capture(element: ChoiceElement): Capture {
	const fields = ['size', ...(element instanceof EnProgressSteps ? ['value', 'label', 'disabled', 'readOnly', 'currentLabel', 'completeLabel', 'errorLabel', 'pendingLabel', 'summaryLabel', 'completedLabel'] : ['heading'])];
	return Object.freeze({ ...Object.fromEntries(fields.map(name => [name, Reflect.get(element, name)])),
		items: Array.isArray(element.items) ? Object.freeze(element.items.map(item => Object.freeze({ ...item }))) : element.items,
	});
}
function sourceChildren(host: TreeElement, _placeholder: TreeElement, kind: FormChildKind): TreeElement[] {
	const descriptor = kind === 'steps' ? 'en-progress-step' : 'a';
	// Match the browser controller's recognized direct-child boundary. Other
	// content keeps its authored bytes and ordinary named-slot semantics.
	return host.childNodes.filter((child): child is TreeElement => isElement(child)
		&& child.namespaceURI === HTML_NAMESPACE && child.tagName === descriptor);
}

// The shared projection constraint is not an arbitrary HTML sanitizer.
function containsInteractive(node: TreeElement): boolean {
	return node.childNodes.some(child => isElement(child) && (
		isFormLabelInteractive(child.tagName, Object.fromEntries(child.attrs.map(attr => [attr.name, attr.value])))
		|| containsInteractive(child)
	));
}
/** Pasted internal metadata is replaced, never trusted as this response's identity. */
function assignSelectionSlot(markup: string, element: TreeElement, value: string): Edit {
	const previous = attribute(element, 'slot');
	if (previous === undefined) return insertAttribute(markup, element, 'slot', value);
	if (!isGeneratedFormSlot(previous)) throw new Error('Form-child SSR cannot replace an authored slot.');
	const location = element.sourceCodeLocation?.attrs?.slot;
	if (!location) throw new Error('Form-child SSR requires the original generated slot location.');
	return { start: location.startOffset, end: location.endOffset, replacement: `slot="${value}"` };
}
