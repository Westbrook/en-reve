import {html} from 'lit';

/** One authoring guide for every component with supporting description content. */
export function descriptionReference() {
  return html`<section class="api-section" id="api-description-guide" tabindex="-1">
    <h3>Supporting descriptions</h3>
    <p>Use <code>description</code> for plain text, <code>slot="description"</code> for formatted supporting content, and <code>::part(description)</code> for styling. Text fields, textareas and both editors use the same markup:</p>
    <pre><code>${['en-text-field','en-textarea','en-token-editor','en-rich-text-editor'].map(tag=>`<${tag} label="Project brief" description="Explain the goal.">
  <span slot="description">Explain the <strong>goal</strong>.
    <a href="/writing-guide">Writing guide</a>
  </span>
</${tag}>`).join('\n\n')}</code></pre>
    <p>The slot replaces the string fallback. Empty and hidden assigned elements still suppress it; removing them restores the latest attribute/property value. Use one wrapper to keep text, formatting and links inline; multiple assigned roots form separate help blocks. An absent or empty fallback adds no help spacing. Whitespace-only strings are preserved.</p>
    <p>Descriptions are separate from labels, placeholders, errors and live status. Field help is associated with the actual control; group help describes the group. Editors keep their built-in keyboard instructions and put guidance outside the editable document. Updating help preserves editing state. Applications translate their own descriptions.</p>
    <p>Dialog, drawer, sheet, media viewer and command palette use the same content API for a short modal summary; put structured long-form content in the body. Their description Part and validation summary's slot-owned description Part support inherited text styling; assigned content owns its detailed box layout. Choice-option descriptions describe one item and must remain noninteractive. Put composer guidance on its slotted editor.</p>
    <p>Composite guidance: color-slider associates its visible description with both the range and nested exact-value input. Range-slider associates its description and current error with both thumbs and both exact inputs. Date-picker associates field guidance and errors with its single input or range trigger; range-dialog endpoints receive their edit instructions and current range rejection. The single-date calendar trigger and calendar navigation retain their action-specific roles.</p>
    <p>The nested color input and date-range trigger use element-reference associations across shadow roots after hydration, in browsers supporting <code>ariaDescribedByElements</code>. Initial server HTML and older browsers still display the guidance, but cannot express these cross-root relationships. Same-root input, thumb and endpoint relationships are present in server HTML. No description text is copied into a hidden mirror.</p>
  </section>`;
}
