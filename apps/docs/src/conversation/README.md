# Conversation demo

`/conversation.html` is a standalone, server-rendered conversation pattern using
our Spectrum-inspired theme, `en-button`, `en-icon`, `en-badge`, and native
semantics styled with en-reve tokens. The Showcase navigation links to it.

The presentation fixture includes response steps, source disclosures, feedback,
a 45-minute outline, suggested follow-ups, and a keyboard-friendly composer.
Chart, poster, and pipeline requests select deterministic local responses.
Attachment names are displayed without reading or uploading file contents.
Reload or **Reset demo** clears the conversation. Light/dark appearance is local
to the page. `?progress-report` exposes the existing developer return link.

Run `npm run dev:docs` for development or `npm run build -w @en-reve/docs` for
production SSR output. Validation evidence: `artifacts/conversation/verification.json`.
