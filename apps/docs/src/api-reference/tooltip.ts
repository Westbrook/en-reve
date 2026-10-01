import { html } from 'lit';

export function tooltipReference(href: (path: string) => string) {
  return html`<section class="api-section" id="api-tooltip-placement" tabindex="-1" aria-labelledby="api-tooltip-placement-title">
    <h3 id="api-tooltip-placement-title">Logical tooltip placement</h3>
    <p><code>inline</code> and <code>block</code> accept <code>start</code>, <code>center</code> or <code>end</code>. They choose a region around the trigger, following its direction and writing mode. The default is <code>inline="center" block="end"</code>, centered below in horizontal writing. Previously the tooltip implicitly aligned its leading edge.</p>
    <ul>
      <li><code>inline="center" block="start"</code>: centered above.</li>
      <li><code>inline="start" block="center"</code>: before the trigger; left in LTR, right in RTL.</li>
      <li><code>inline="end" block="center"</code>: after the trigger; right in LTR, left in RTL.</li>
      <li>Start/end on both axes chooses an outside corner. Center/center resolves to block end so help does not cover its trigger. Invalid or removed attributes use each axis’s default.</li>
    </ul>
    <pre dir="ltr"><code>&lt;en-button id="history-help"&gt;History&lt;/en-button&gt;
&lt;en-tooltip for="history-help" inline="center" block="start"&gt;
  &lt;span slot="content"&gt;View previous revisions.&lt;/span&gt;
&lt;/en-tooltip&gt;</code></pre>
    <p>These are preferred positions: an overflowing axis flips if its opposite fits better, then shifts within the visible viewport. Live <code>.inline</code>/<code>.block</code> updates preserve the open surface and focus. Both properties use the exported <code>TooltipAxis</code> type.</p>
    <p>CSS Anchor Positioning supplies the tether when supported and the relationship resolves; measured coordinates provide the fallback. Both paths share viewport collision handling. The component manages root-scoped anchor names and a <code>::part(surface)</code> rule, preserving existing trigger names and cleaning up on close or disconnect. JavaScript still handles collisions, timing and pointer transit. The same-root <code>for</code> contract and popover placement remain unchanged.</p>
    <p><code>::part(surface)</code> styles the tooltip. For centered text use <code>text-align: center</code>; this is separate from centering the surface. The existing overlay background, color, padding, radius and motion tokens still apply. Hover and focus descriptions remain noninteractive and available through <code>aria-describedby</code>.</p>
    <p><a href=${href('/api-examples/tooltip-warmup#tooltip-position-example')}>Try placement, RTL and viewport adjustments</a>.</p>
  </section>`;
}
