import {html} from 'lit';
export function presenceActivityReference(href:(path:string)=>string){return html`<section class="api-section" id="api-presence-activity-guide" tabindex="-1"><h3>Authored identities and activity</h3>
<p>Try the <a href=${href('/api-examples/presence-activity')}>themed live demo and complete source</a>, or expand Collaborators and project activity in the <a href=${href('/workflows/chat')}>Chat workflow</a>. Authored and keyed activity histories share the same availability displays; no service connection or online status is inferred.</p>
<pre><code>${`<en-presence-group label="Review team" max="3">
  <en-presence name="Mira Chen" status="online"></en-presence>
  <en-presence name="Jules Martin" status="busy" status-label="Reviewing"></en-presence>
  <!-- Add more direct en-presence children; +N expands in place. -->
</en-presence-group>
<en-activity-feed label="September 15 activity" updates pending="2" has-more>
  <h3 slot="header">September 15</h3>
  <en-activity-item author="Mira Chen" datetime="2026-09-15T10:15:00"
    time-label="10:15 AM" label="Mira added a cover study">
    Added a quieter cover study.
    <en-button slot="actions">Review cover study</en-button>
  </en-activity-item>
</en-activity-feed>`}</code></pre>
<h4>Identity, availability and overflow</h4>
<p><code>en-presence</code> exposes avatar, name and status slots. Its avatar is decorative; visible name and status convey identity once and do not rely on color. Keep all identity slots noninteractive. Set a nonempty href to make the whole identity a native link; omit it for an informational identity without a Tab stop. target and rel pass through to the anchor. focus(options) targets that anchor. There is no actions slot; place separate controls beside the element. The <code>name</code> property supplies initials when no avatar is authored. Status values are online, away, busy and offline; unknown values use offline. Use <code>status-label</code> or the status slot for localized or richer descriptions. Availability changes are silent unless your application deliberately announces them.</p>
<p>The live demo includes a linked identity. Native navigation preserves Enter, modifier-click, open-in-new-tab and copy-link behavior:</p>
<pre><code>${`<en-presence name="Mira Chen" status="online"
  href="/people/mira/projects"></en-presence>`}</code></pre>
<p><code>en-presence-group</code> consumes direct slotted en-presence children. It reacts to additions, removal, reordering and authored hidden attributes. Wrappers and forwarded slots are not flattened in this first version. <code>max</code> defaults to 4, floors positive fractions to at least 1, and uses 4 for invalid/nonpositive values. Overflow identities remain the same DOM nodes; expansion changes their visibility. Before hydration every identity is readable. Supply <code>expanded</code> for an initially expanded group.</p>
<p>The disclosure emits one cancelable <code>en-change</code> with previous/proposed booleans and reason <code>disclosure</code>. Call preventDefault to roll back; a synchronous author assignment wins, even a same-value assignment. Property writes emit no event. When collapsing a focused overflow identity, focus returns to the disclosure. Localize <code>more-label</code> (with {count}) and <code>less-label</code>.</p>
<h4>Content ownership, grouping and loading</h4>
<p><code>en-activity-item</code> exposes author, decorative avatar, metadata, body, attachments and actions slots. Supply a concise <code>label</code> for its article and an ISO <code>datetime</code> plus localized <code>time-label</code> for the native timestamp fallback. The retained <code>metadata</code> slot replaces that entire fallback, so authored context can include its own <code>time</code> element without nested timestamps. Assigned content always wins over timestamp property updates; removing it restores the latest fallback. Style its generic wrapper with <code>::part(metadata)</code>; <code>::part(time)</code> applies only to the component-owned fallback. Set the property <code>embedded=true</code> when an external listitem already owns the entry (the data feed does this automatically). Keep interactive descendants in body, attachments or actions, and give repeated actions contextual names. Its <code>focus(options)</code> method targets the article for explicit application navigation.</p>
<p><code>en-activity-feed</code> renders a named list. It deliberately does not use ARIA feed: neither a virtual list nor manual paging promises screen-reader reading-cursor continuity across unloaded records. In authored mode (items undefined), use one named feed per date/group. Author entries in reading order with stable keys; that mode never reorders, deletes, buffers or fetches them.</p>
<p>Opt into <code>updates</code> to retain a Show updates button even at zero <code>pending</code>, when it becomes unavailable and says Up to date. <code>has-more</code> exposes Load older activity. Both emit a bubbling, composed, cancelable <code>en-action</code> with <code>detail.action</code> equal to show-updates or load-more and data undefined. Requests do not mutate content. Loading blocks repeat requests, keeps loaded entries readable and exposes the loading slot. Empty is explicit, with its own slot. Keep exhausted/loading controls mounted with aria-disabled when preserving their focus matters.</p>
<pre><code>${`feed.addEventListener('en-action', event => {
  // Defer until ancestor listeners have also had a chance to cancel.
  queueMicrotask(() => {
    if (event.defaultPrevented) return;
    if (event.detail.action === 'show-updates') showBufferedEntries();
    if (event.detail.action === 'load-more') loadOlderEntries();
  });
});
// These functions belong to your application. Keep keyed entries mounted.
feed.pending = bufferedEntries.length;
feed.announcement = 'Two new updates available. Choose Show updates when ready.';`}</code></pre>
<p>Incoming updates should wait in application state. The demo changes only its persistent summary, so the history and reading position stay put until requested. Showing updates retains focus on its button; loading appends older content and reports a concise result. The older date group’s loading slot previews the same activity-item layout as its loaded row: avatar, author, time, body and action. A single persistent polite status sits beside the older content, so loading, completion and failure can be read in context. It is mounted empty before requests begin; the demo updates its text without replacing it or moving focus. The decorative preview is inert and hidden from accessibility APIs; its real layout dimensions come from the shared item template. Previously loaded entries remain mounted, and the pending preview appears at the append position. Failed loading retains entries and offers Retry. The <code>announcement</code> property updates a separate polite status region; the history itself is never a live region. Translate every control/state label through its documented property.</p>
<h4>Large, keyed histories</h4>
<p>Try <a href=${href('/api-examples/presence-activity#activity-history-example')}>Large activity history</a>. Assign <code>items</code> to opt into data rendering; <code>items=[]</code> is an empty data history and <code>items=undefined</code> restores the authored slot. Each <code>ActivityRecord</code> has a unique nonblank string <code>key</code>, <code>author</code>, <code>text</code>, optional <code>datetime</code>, <code>timeLabel</code>, article <code>label</code> and a localized <code>group</code>. The application supplies newest-first order and date/time formatting. Contiguous equal group labels share a visual boundary; records are never sorted or timezone-converted implicitly. Duplicate/invalid keys reject the assignment atomically.</p>
<p><code>renderItem(item, index)</code> supplies the managed activity item's slot content: body, avatar, author, metadata, attachments and actions. Return Lit content and controls, not an additional activity-item/listitem wrapper. The feed owns one listitem per record, with its absolute position and loaded count. It preserves keyed DOM identity when records change or move; replace the items array and changed records rather than mutating them in place. When seeding the feed from a Lit template, use <code>.items=&#36;{guard([records], () =&gt; records)}</code>: unrelated rerenders must not reassign the original seed and overwrite loaded records or cancel an active request. A genuinely new source array still takes authority.</p>
<pre><code>${`feed.items = [{
  key: 'update-1', author: 'Mira Chen', text: 'Added a cover study.',
  group: 'September 17, 2026', datetime: '2026-09-17T10:30:00Z', timeLabel: '10:30'
}];
feed.renderItem = item => html\`\${item.text}
  <en-button slot="actions">Review update</en-button>\`;
feed.mode = 'virtual';
feed.style.setProperty('--en-activity-viewport-size', '30rem');
feed.bufferItems(newestFirstArrivals);  // no DOM/reading-position changes
feed.showUpdates();                   // cancelable en-action; stable reading anchor
feed.scrollToKey('update-1', {block: 'start', container: 'nearest'});`}</code></pre>
<p><code>mode="all"</code> is the default and renders every loaded item. <code>mode="virtual"</code> measures variable row heights using the shared collection controller, bounds mounted content, preserves a visible key on prepend/resize, and pins a focused record plus its neighbors so Tab can continue in order after scrolling away. A persistent group context remains visible above the virtual viewport even when a date-boundary row is outside the window; each record also exposes its group as an accessible description. Initial SSR renders a deterministic eight-record window. Use <code>scrollElement</code> for the virtual scroll surface, and <code>invalidateMeasurements()</code> after changing offscreen theme/font/density assumptions.</p>
<p><code>all</code>, <code>paginated</code> and <code>virtual</code> are the shared delivery names; legacy <code>list</code> and <code>paged</code> spellings retain their behavior. <strong>Choose paginated reading for a stable complete reading tree.</strong> <code>mode="paginated"</code> mounts every record on its current page and never removes those entries on scroll. Set one-based <code>page</code> and <code>pageSize</code> (default 20), or call <code>requestGoToPage(page)</code> for committed, unchanged, canceled, superseded or unavailable (no data array/nonfinite input). Existing <code>goToPage(page)</code> stays true only when committed. Neither result promises render or scroll completion. It emits cancelable <code>en-page-change</code> with <code>{previous, proposed, reason: 'pagination'}</code>. The page property exposes the proposal during dispatch; cancellation rolls back unless an authoritative page write or accepted nested proposal supersedes it. The deprecated <code>detail.page</code> alias remains available. Pages cover loaded records only; Load older activity extends the available pages. <code>scrollToKey(key, options)</code> accepts the shared scrollIntoView options, returns false for unknown loaded keys and selects the containing page when necessary. It does not move focus. Changing to paginated mode retains the focused key's page; if a focused record is removed or a page replacement removes its control, focus recovers to the next available article or the history viewport. No user-agent or screen-reader detection changes the reading mode automatically.</p>
<p>Buffer arrivals with <code>bufferItems(records)</code> in newest-first order. Repeated keys replace buffered versions; <code>pendingCount</code> reports the unique buffer count. <code>showUpdates()</code> commits the buffer ahead of loaded history while deduplicating keys. It retains the reading anchor rather than automatically jumping to the first new item; offer a separate Jump to newest control using scrollToKey. The authored <code>pending</code> property is ignored in data mode. An accepted show-updates en-action performs this data operation; an application items write during the event wins and leaves the buffer uncommitted.</p>
<h4>Application-owned asynchronous pages</h4>
<p><code>hasMore</code> enables data loading through the Load older control or <code>requestOlder()</code>. The cancelable load-more <code>en-action</code> runs first, then <code>en-load-request</code> provides cursor/signal in <code>detail</code> and a <code>respondWith(pageOrPromise)</code> method. Claim the response once, synchronously in the listener. Its resolution completes loading; rejection reports an error. There is no built-in fetch, caching policy or service. A true return from requestOlder means acceptance, not completion.</p>
<pre><code>${`import type { ActivityLoadRequestEvent } from '@en-reve/elements/activity-feed.js';

function loadOlder(event: ActivityLoadRequestEvent): void {
  const {cursor, signal} = event.detail;
  // Claim now; defer transport until every listener has had a chance to veto.
  event.respondWith(Promise.resolve().then(() => {
    signal.throwIfAborted();
    return application.loadHistory({cursor, signal});
  }));
}
feed.addEventListener('en-load-request', loadOlder);
feed.addEventListener('en-load-state-change', event => {
  // Noncancelable: loading → loaded | empty | error, or idle after cancellation.
  renderLoadStatus(event.detail.status, event.detail.requestId);
});
feed.cancelLoad(); // also available as the Cancel loading control`}</code></pre>
<p>The existing <code>detail.complete(page)</code> and <code>detail.fail(message)</code> callbacks remain available and safe after await. Choose callbacks or respondWith; the first claim owns settlement. Callback-only handlers must complete, fail or explicitly cancel. The deprecated <code>en-load</code> request fires only if the new request was neither claimed nor canceled; both use one lease. Migrate a handler to the new event, rather than subscribing transport to both names. <code>loadState</code> exposes the most recent managed request status independently of author-owned loading presentation.</p>
<p>Completion appends unseen keys and replaces existing keys in place, updates cursor/hasMore and clears the loading state. Errors retain records and cursor and expose Retry. A request can settle only once. Cancellation, disconnection or authoritative items replacement aborts its signal; late callbacks are ignored. When replacing the data source, set its new cursor/hasMore alongside items. Exhausted data load controls stay mounted and unavailable to preserve focus. The demo exposes complete/fail controls and an inert, accessibility-hidden loading card shaped like the expected entry. Put concise loading/outcome text in the persistent <code>announcement</code> status; the history is not a live region. Translate retry-label, cancel-label, previous-label, next-label and page-label ({page}/{pages}) along with the original labels.</p>
<p>Virtualization retains DOM focus, not the screen reader's independent reading cursor. Automated DOM/ARIA snapshots are useful baselines and do not establish VoiceOver/iOS acceptance; the explicit paginated option remains available for that reason. Fetching records does not automatically advance a page or move focus.</p>
<h4>Themes and CSS Parts</h4>
<p>Defaults use the current theme’s semantic surface, boundary, text, spacing, radius and status colors; buttons and avatars keep their own theme behavior. Managed <code>component.presence.*</code>, <code>component.presence-group.gap</code> and <code>component.activity.*</code> tokens supply optional overrides. Parts let applications choose layout without replacing semantics:</p>
<pre><code>${`en-presence-group::part(members) { justify-content: flex-start; }
en-presence::part(base) { border-color: transparent; }
en-activity-feed::part(updates), en-activity-feed::part(load-more) {
  justify-self: start;
}
en-activity-item::part(header) { align-items: baseline; }`}</code></pre>
<p>Presence Parts: base, link (when href is set), avatar, name, status and indicator. Linked identities use semantic link text, hover-capability-gated surface/border styling, and the shared theme focus contour. Override component.presence.hover-background and component.presence.hover-border-color to customize hover; the link Part also exposes the anchor. Group Parts: base, members and overflow. Activity item Parts: item, base, header, author, time, content, attachments and actions. Feed Parts: base, list, updates, load-more, empty, loading and announcement; keyed data additionally exposes viewport, row, group-heading, group-context, pagination, cancel-load and error. Use --en-activity-viewport-size to size virtual history; the other activity spacing/surface tokens apply to its cards. Keep accessible status text and disclosure controls available when customizing.</p></section>`;}
