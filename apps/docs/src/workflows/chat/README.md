# Contextual chat workflow

`createChatWorkflow({ requestUpdate })` returns `render`, `reset`, `dispose`, and `styles`; `chatStyles` is also exported. The host registers `en-button`, `en-card`, `en-textarea`, `en-slider`, and `en-select`. Construction and rendering do not access browser globals. Request lanes, fixture scheduling, signals, and drafts belong to each instance. Dispose cancels pending work; reset starts the local scene again.

This is a deterministic authored fixture, with no model, messaging backend, authentication, persistence, or attachments. Reply strings are rendered as text. Its only supported action changes the selected Cover image's whole-number opacity from 0 through 100. Capability, action, target identity/presence, editing permission, value, and base revision are validated before preview and again at actual application after a delayed response. Production adapters need corresponding authoritative server validation.

The opacity proposal uses the single tentative `en-change`: the application cancels synchronously, validates the whole-number value and current card, updates its model, then writes the accepted public slider value. Rejection rolls back without changing the card. Fixture selectors observe only uncanceled, still-current values after dispatch. No `controlled` attribute is required.

The textarea remains mounted and editable while sending. Ordinary renders do not assign its current draft. Success clears only the same submitted draft revision; Retry message resends the visible original message without overwriting a newer draft. Enter remains a newline. One unresolved context card survives other sends, and terminal decisions remain in their source message when a later card replaces it. Preview and Apply are separate intentional actions. A collaborator change requires Refresh preview before a new Apply; refresh preserves proposed value and all capability constraints.

The conversation is a labelled scroll region, not live content. One permanent status node announces a bounded outcome. Incoming turns do not focus or scroll; Show new message and Review latest adjustment provide named intentional routes. Action controls that disappear move focus to a persistent adjacent heading only if that action was focused. No component shadow internals are queried.

Manual QA in `/workflows/chat.html`, scoped to `[data-workflow="chat"]`:

- Send message, continue a multiline draft while pending, and verify it survives the reply. Review latest adjustment, edit Proposed opacity, Preview adjustment, then Apply adjustment or Cancel adjustment.
- Open Chat simulation controls. Next reply → Fail once; send and Retry message. Change the next draft during both requests. Retry adjustment similarly exercises a retained preview after an apply failure.
- Response timing → Held. Preview and Apply; Add collaborator turn before Release pending response. The current image must remain the collaborator's revision, with an explanatory stale error and Refresh preview recovery.
- Repeat a held Apply while revoking access or removing the target. Nothing applies. Restore access/target and explicitly refresh. Unsupported action/capability, wrong target, and invalid value replies never become applicable actions.
- Send while a card is unresolved: the current proposal remains. After applying/canceling, a deliberate new send can create another card while retaining the old outcome in the transcript.
- Read an earlier message and type a draft, then add a collaborator turn. Check scroll position/draft, keyboard routes, and the single status announcement. Check narrow screens, RTL, forced colors, reduced motion, and screen-reader navigation.
- Hold both operations, cancel pending requests or reset, then release. Late outcomes cannot mutate the new state. Reset/dispose abort pending work.

Stable selectors: `data-workflow="chat"`; `data-testid="chat-composer"`, `chat-send`, `chat-transcript`, `chat-status`, `chat-current`, `chat-adjustment`, `chat-problem`, `chat-qa`. Prefer public labels for controls and actual browser behavior; never regex-test rendered strings as a substitute for interaction.
