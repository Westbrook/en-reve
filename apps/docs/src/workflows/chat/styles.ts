import { css } from 'lit';

export const chatStyles = css`
	[data-workflow='chat'] { display: grid; gap: var(--en-space-sections); min-inline-size: 0; }
	[data-workflow='chat'] * { box-sizing: border-box; }
	[data-workflow='chat'] :is(h3, h4, p) { margin: 0; }
	[data-workflow='chat'] header { display: grid; gap: var(--en-space-3); }
	[data-workflow='chat'] .chat-product,
	[data-workflow='chat'] .chat-composer,
	[data-workflow='chat'] .chat-context,
	[data-workflow='chat'] .chat-qa { display: grid; gap: var(--en-space-fields); min-inline-size: 0; }
	[data-workflow='chat'] .chat-actions { display: flex; flex-wrap: wrap; align-items: center; gap: var(--en-space-actions); }
	[data-workflow='chat'] .chat-transcript {
		block-size: var(--en-layout-panel-preferred); overflow: auto; overflow-anchor: none;
		padding: calc(var(--en-focus-width) + var(--en-focus-offset));
		border: var(--en-border-width) solid var(--en-color-boundary);
		border-radius: var(--en-radius-container); background: var(--en-color-surface);
		scroll-padding: var(--en-space-panel);
	}
	[data-workflow='chat'] .chat-transcript ol { display: grid; gap: var(--en-space-fields); list-style: none; padding: var(--en-space-3); margin: 0; }
	[data-workflow='chat'] .chat-turn { display: block; min-inline-size: 0; }
	[data-workflow='chat'] .chat-turn p { white-space: pre-wrap; overflow-wrap: anywhere; }
	[data-workflow='chat'] .chat-muted { color: var(--en-color-text-muted); }
	[data-workflow='chat'] .chat-status { min-block-size: var(--en-font-ui-size); }
	[data-workflow='chat'] .chat-comparison { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, var(--en-size-swatch)), 1fr)); gap: var(--en-space-4); }
	[data-workflow='chat'] figure { margin: 0; display: grid; gap: var(--en-space-2); }
	[data-workflow='chat'] .chat-artboard { position: relative; min-block-size: calc(var(--en-size-swatch) * 2); border-radius: var(--en-radius-container); border: var(--en-border-width) solid var(--en-color-boundary); background: var(--en-color-canvas); overflow: clip; }
	[data-workflow='chat'] .chat-artwork { position: absolute; inset: 0; background: linear-gradient(140deg, var(--en-color-action), var(--en-color-accent-subtle)); opacity: var(--chat-image-opacity); }
	[data-workflow='chat'] .chat-artboard span { position: relative; display: block; inline-size: fit-content; margin: var(--en-space-3); padding: var(--en-space-2) var(--en-space-3); border-radius: var(--en-radius-control); background: var(--en-color-surface); color: var(--en-color-text); font-weight: var(--en-font-heading-small-weight); }
	[data-workflow='chat'] .chat-problem { color: var(--en-color-danger-text); }
	[data-workflow='chat'] .chat-qa { border-block-start: var(--en-border-width) solid var(--en-color-line); padding-block-start: var(--en-space-sections); }
	[data-workflow='chat'] .chat-qa > summary { cursor: pointer; padding-block: var(--en-space-2); min-block-size: var(--en-size-target-min); }
	[data-workflow='chat'] .chat-qa > :not(summary) { margin-block-start: var(--en-space-3); }
	[data-workflow='chat'] .chat-qa-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, var(--en-layout-panel-preferred)), 1fr)); gap: var(--en-space-fields); }
	[data-workflow='chat'] :where(.chat-transcript, .chat-turn, .chat-context-heading):focus { outline: var(--en-focus-width) solid var(--en-color-focus); outline-offset: var(--en-focus-offset); }
	@media (forced-colors: active) {
		[data-workflow='chat'] .chat-artwork { background: CanvasText; }
		[data-workflow='chat'] .chat-problem { color: CanvasText; }
	}
`;
