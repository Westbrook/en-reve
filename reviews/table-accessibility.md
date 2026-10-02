# Collection accessibility review

Review pass: 2026-09-12. This records engineering checks and a manual acceptance
protocol for the composed table work. It does **not** record a completed
screen-reader or physical-device review. The current automated tools expose browser
DOM/accessible-name checks and native keyboard input, but not a screen reader's
spoken output or browse cursor. All platform results below therefore remain Pending.

## Review surfaces

- [Large collection lab](https://en-reve-docs.reve-ai-0869.chatgpt.site/api-examples/virtual-collection?progress-report): compare Table/List and Windowed/Paginated using the same 10,000 records. Expand **scrollToKey()** or **Find an asset** below the collection to locate a stable key.
- [Asset Browser](https://en-reve-docs.reve-ai-0869.chatgpt.site/workflows/assets?progress-report): review the composed API in an application workflow, including filtering, sorting, selection and Preview.

Record the published build shown by the Progress Report before starting. A result
belongs to that build and the exact browser/OS/assistive-technology versions used;
it must not be silently carried forward as approval of later changes.

## Expected semantics and limits

The native table contains independently interactive buttons and selection controls. It is
not an arrow-key cell-navigation grid. The lab uses multiple-selection checkboxes;
the Asset Browser preserves its single-selection radio choice for insertion.
Selection belongs to those labelled controls;
row styling can mirror that state without implying selectable ARIA table rows.
Captions and native `th` scopes provide table and header meaning. This follows the
[APG table pattern](https://www.w3.org/WAI/ARIA/apg/patterns/table/).

A virtual table exposes the complete logical row count and ordered indices for
every exposed header, data and footer row. Spacer rows are hidden from the
accessibility tree. A virtual list exposes each mounted record's position and the
complete set size. Metadata describes omitted records; it does not make their
content readable. Index consistency follows
[APG grid and table properties](https://www.w3.org/WAI/ARIA/apg/practices/grid-and-table-properties/).

Sorting operates on the complete matching record set. Its button name describes
what can be sorted and its next action; `aria-sort` describes the active direction
on the header. A sort operation must preserve the triggering button and report its
outcome without turning the result collection into a live region. See the
[APG sortable table example](https://www.w3.org/WAI/ARIA/apg/patterns/table/examples/sortable-table/).

Paginated delivery mounts the complete current page. It is the sequential-reading
alternative, **not** a promise that browser Find, print or a screen-reader browse
cursor can access every page at once. Search/reveal and page navigation make other
records reachable. Printing the current page must remove scroll clipping and
sticky positioning. A complete-dataset export/print surface is future work if
required by a consuming application.

DOM focus retention is different from screen-reader browse-cursor retention.
Pinning the focused input does not establish that a screen reader's virtual cursor
will survive unmounting elsewhere. Never claim windowed browse reading is proven
by a passing Playwright focus test. Do not remove pagination based on those tests.

Styled lists explicitly retain `role="list"` when removing list markers. This
avoids WebKit's intentional suppression of unstyled-list semantics, documented in
[WebKit issue 170179](https://bugs.webkit.org/show_bug.cgi?id=170179). The role
preserves structure; it does not validate spoken output.

## Short manual walkthrough

Run the lab first in Paginated/Table, then repeat in Windowed/Table and both List
modes. Keep focus/reading commands native; do not use the inspector to substitute
for the user's navigation.

1. **Discover the collection.** Locate its caption/region with the screen reader.
   Read the first three records using table or list reading commands. Confirm the
   asset name, description and type remain associated, and selection-control names include
   the corresponding asset. In windowed mode, record actual row/position/count
   announcements; spacer rows must not be announced as empty records.
2. **Select and sort.** Reach a lab selection checkbox, toggle it, then sort by Name.
   Confirm the checkbox state is announced once, the sort control explains its
   action/direction, and the selected asset remains selected under the new order.
   In the Asset Browser, use a second sortable column and confirm only the active
   sort is exposed. Selection-control activation must not alter row height.
3. **Read across a page/window boundary.** In Paginated, read the last record, use
   Next page and continue through the next page. The control stays usable and the
   new page is announced. Go back and confirm selection persists. In Windowed,
   continue reading past the current mounted boundary and record any stall, skipped
   content or browse-cursor relocation. These outcomes are compatibility findings,
   not something an ARIA row count can solve on its own.
4. **Keep keyboard focus during scrolling.** Focus a checkbox well into the list,
   scroll far away without moving focus, then Tab/Shift+Tab. The same focused input
   must remain connected and the next/previous authored control must be reached
   in record order and revealed clear of sticky surfaces. Compare this separately
   with the screen-reader browse cursor. Safari keyboard-navigation preferences
   can change whether ordinary Tab includes controls; record the setting.
5. **Find and reveal.** Enter `asset-09000` in the lab's collapsed controls. Show
   asset must reveal the record or open its page without selecting it or moving
   focus away from the action. Try an absent key: report not found, preserve
   selection and position. In the Asset Browser, apply a filter with no matches,
   recover by clearing it and confirm the persistent status communicates the result.
6. **Mutate while working.** Remove selected records and ensure focus stays on the
   action that initiated removal. For an externally removed *focused* record,
   verify the application's explicit focus-recovery target. Switch presentation
   and delivery using their controls: focus stays on the initiating control and
   selections retain stable record identity. Preview opens with an appropriate
   heading and closes back to its initiating control or a documented fallback.
7. **Compare Find and print.** In Paginated, use browser Find for a name on the
   current page, then one only on the next page. Only the former is expected to
   exist until navigation. In print preview, the complete current page, its header
   and caption must be readable without a fixed-height cut-off. Windowed printing
   is intentionally incomplete; use Paginated for the current-page review.
8. **Use small screens and preferences.** Repeat key actions in iPhone portrait,
   iPad portrait/landscape and Android phone/tablet. Pan horizontally inside the
   table without widening the page, read sticky headings with body content visible,
   and verify focus isn't covered. Repeat at increased text size, reduced motion,
   forced colors where supported, and RTL. Touch exploration and external-keyboard
   navigation are separate checks.

## Platform record

Fill each result independently; keyboard-only review is not screen-reader approval.
Do not mark a platform Pass if the only evidence is a Playwright browser project.

| Environment | Screen reader / mode | Status | Required evidence |
| --- | --- | --- | --- |
| macOS + Safari, current and previous supported release | VoiceOver, table navigation and browse reading | Open traversal finding; remaining scenarios Pending | Exact affected OS/browser/VO versions still to record; see known issue below |
| macOS + Chrome | VoiceOver, table navigation and browse reading | Same traversal issue reported; remaining scenarios Pending | Exact affected OS/browser/VO versions still to record; compare the same record/window |
| Windows + Chrome or Edge | NVDA, browse/table navigation and focus mode | Pending | OS/browser/NVDA versions, steps 1–7 |
| Windows + Firefox | NVDA | Pending | Same scenarios, especially logical row indices |
| iPhone 12 Pro + iOS 18.7.7 user device, and current supported iOS | VoiceOver, swipe/touch exploration | Pending | Record each OS version separately; portrait, scroll + select/reveal |
| iPad + Safari | VoiceOver, touch and external keyboard where available | Pending | Portrait/landscape, table pan and sticky reading space |
| Android phone/tablet + Chrome | TalkBack | Pending | OS/browser/TalkBack versions, swipe exploration and selection |

For each finding record: build; device/OS/browser/AT versions; presentation and
delivery; key/filter/page; exact steps; expected behavior; spoken output or cursor
behavior actually observed; Pass/Fail/Blocked; screenshot/recording if useful.
Evidence can be submitted through the associated Progress Report review card.

## Engineering evidence and remaining acceptance

`apps/docs/tests/collection-accessibility.spec.ts` checks structural metadata after
scrolling, sticky summary semantics, full-page stability, print overflow rules,
sort names/state, keyboard activation and recovery after asynchronous deletion of
a focused record. Existing `virtual-collection.spec.ts`
checks focused node identity, native sequential Tab, selection persistence, deletion,
SSR/hydration identity and automated accessibility rules. These are complementary
browser checks. Their execution receipts belong to the current Progress Report.

This pass can finish implementation and publish review surfaces while actual AT
acceptance remains open. A passing automation report cannot close the Pending
platform rows above. The release decision must consider recorded real-user results,
including whether Windowed remains an optional mode for a given audience.

## Compact selection label follow-up

VoiceOver review reported a second reading stop for each visually clipped selection
label. The collection now uses a plain label attribute with `::part(label-text)`
hidden. A same-shadow `aria-labelledby` retains its computed name in initial SSR
and after hydration, without an independently exposed text node. General visible
and rich choice labels remain exposed. Confirm the actual VoiceOver reading stops
again; browser accessibility snapshots are supporting evidence only.

Axe's `label-title-only` best-practice rule flags these deliberately nonvisual
labels. The browser suite retains that raw finding and permits it only on the
exact compact selection inputs, each verified against its visible Select column,
native asset row header and computed name. Other rules and other controls still
fail the scan. This is a documented contextual-label judgment, not a claim of a
zero-finding scan or completed screen-reader acceptance.

## Known issue: VoiceOver traversal after collection scrolling

Status: **Open, user-reported in Safari and Chrome**. The report concerns the
large collection table. The exact browser/OS versions and affected record/window
still need to be recorded; earlier iPhone version details must not be assumed to
describe this desktop VoiceOver run.

Reported sequence:

1. Scroll through a few windows of table records.
2. Select and then deselect a checkbox.
3. Navigate backwards through records with VoiceOver Left Arrow commands.
4. Reading initially follows earlier rows, then skips; subsequently both Left and
   Right navigation move backwards rather than allowing predictable traversal.

This is different from an ordinary end-of-row announcement. It affects VoiceOver
navigation in more than one browser; it is not established as a WebKit-only defect.
The observed reading failure remains open even when DOM order, logical row indices
and native keyboard-focus checks pass. No specific root cause or fix is claimed.

### Engineering comparison

Capture the **complete mounted table**, not only the active checkbox, in Chromium,
Firefox and WebKit at these checkpoints: initial delivery; after ordinary scrolling;
after `scrollToKey()`; and during a Tab/Shift+Tab sequence that retains a focused
record outside the normal window. Include the select/deselect transition from the
reported sequence. Record row keys, native DOM order, `aria-rowcount`, every
exposed header/data/footer row's `aria-rowindex`, spacer hiding/presentation,
checkbox names/states, native focus identity and scroll position. Selection alone
must not reorder or replace the record's native input.

Playwright's ARIA snapshots are derived from DOM semantics and accessible-name
computation. They are **not snapshots of the operating system's native
accessibility table or VoiceOver's cursor state**, and cannot establish spoken
traversal order. Retain them as structural comparison evidence with the exact
build and browser versions. The current checkpoint's execution outcome belongs in
the Progress Report; this protocol does not predeclare that outcome.

If those comparisons expose an implementation defect, fix it and repeat the exact
VoiceOver sequence. If they do not, retain this known issue with the evidence;
do not close it, label VoiceOver navigation verified, or attribute the failure to
a browser solely because the automated checks pass.

### Manual comparison and revisit triggers

Repeat the same operations in **Paginated** delivery, with the complete current
page mounted, and record whether traversal remains predictable there. Paginated
is the available sequential-reading alternative, not an assumed successful result
for this particular report. Compare table versus list separately if useful; neither
DOM focus pinning nor a retained checkbox establishes browse-cursor retention.

Revisit when a browser or OS update may change accessibility behavior; when native
accessibility inspection becomes available; when a smaller reproducer or more
precise affected row/build is captured; or when our row structure, slot naming,
focus retention or virtualization update strategy changes. Record native table
coordinates and cursor movement if that tooling becomes available. Do not detect
assistive technology, intercept VoiceOver commands, or rebuild the table to force
an accessibility refresh. Closing this issue requires a successful manual repeat
of the reported sequence on the affected environments, with versions and build
recorded.
