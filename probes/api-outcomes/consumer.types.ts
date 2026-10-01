import type { EditorActionEvent } from '@en-reve/elements/token-editor.js';
import { EnTokenEditor } from '@en-reve/elements/token-editor.js';
import { EnRichTextEditor } from '@en-reve/elements/rich-text-editor.js';
import { EnEditorToolbar } from '@en-reve/elements/editor-toolbar.js';
import { EnCarousel } from '@en-reve/elements/carousel.js';
import { EnActivityFeed } from '@en-reve/elements/activity-feed.js';
import { EnAccordionItem } from '@en-reve/elements/accordion-item.js';
import { EnNavigation } from '@en-reve/elements/navigation.js';
import { EnNavigationGroup } from '@en-reve/elements/navigation-group.js';
import type { ChangeOutcome } from '@en-reve/primitives/interactions/events.js';
import { snapshotEditorData } from '@en-reve/primitives/interactions/chat-editor.js';

for (const editor of [new EnTokenEditor(), new EnRichTextEditor()]) {
  const value: string = editor.value, draft: string = editor.draftValue;
  const composing: boolean = editor.composing;
  const focused: void = editor.focus({ preventScroll: true });
  void [value, draft, composing, focused];
  // @ts-expect-error composition state is readonly
  editor.composing = false;
  // @ts-expect-error drafts are readonly; assign value/document for author writes
  editor.draftValue = '';

}
const focused: void = new EnEditorToolbar().focus({ preventScroll: true });
const carousel = new EnCarousel(), feed = new EnActivityFeed();
const keyOutcome: ChangeOutcome | 'not-found' = carousel.requestGoToKey('a');
const pageOutcome: ChangeOutcome | 'unavailable' = feed.requestGoToPage(2);
const found: boolean = carousel.goToKey('a'), committed: boolean = feed.goToPage(2);
for (const disclosure of [new EnAccordionItem(), new EnNavigation(), new EnNavigationGroup()]) {
  const outcome: ChangeOutcome = disclosure.requestOpen(true); void outcome;
}
void [focused, keyOutcome, pageOutcome, found, committed, snapshotEditorData({ value: ['x'] })];

const onAction = (event: EditorActionEvent) => {
  const data = event.detail.data;
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    // @ts-expect-error event JSON records are readonly
    data['changed'] = true;
  }
};
new EnTokenEditor().addEventListener('en-action', onAction);
new EnRichTextEditor().addEventListener('en-action', onAction);
