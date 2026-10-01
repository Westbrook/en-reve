# EDIT-1: structured clipboard interoperability

Copy and cut write `text/plain` plus a best-effort `application/x-en-editor+json`
fragment. Rich editors also write sanitized `text/html`. The private envelope is
independently versioned: `{type: 'en-editor-clipboard', version: 1, runs, rich?}`.
`runs` is a readable text/token projection. `rich` is a validated rich-schema
fragment including open boundaries, rather than a saved whole document.

Paste selects the compatible fragment first. Registered token types retain their
JSON data with fresh occurrence IDs; unregistered types become fallback text.
Token editors flatten rich formatting. Rich editors retain supported paragraphs,
headings 1–3, lists, strong/emphasis, links and line breaks. Plain-text insertion
retains current rich marks and converts newlines into paragraphs. Neither editor
runs clipboard-provided code. Trusted renderers still need application-specific
validation before treating imported token data as domain objects or permissions.

External HTML is parsed in an inert template and rebuilt using that same narrow
allowlist. Arbitrary attributes, CSS, images/embeds, scripts, SVG and custom token
markup are removed. Link destinations follow the existing safe URL policy. Rich
fragments receive schema, token, link and open-depth validation. Invalid/private
versions fall back to text. Private JSON and HTML are capped at 1,000,000 UTF-16
code units, depth 40 and 20,000 visited values/nodes. Plain text retains the existing
editor policy. Browser or application stripping of the private MIME does not break
the plain-text fallback.

Copy does not change the document. Cut removes content only after successfully
writing text to the clipboard; its change remains cancelable. Cut and paste share
the existing undo history and restore prior document/selection through undo.
Canceled edits and synchronous author writes retain existing precedence rules.
Readonly, disabled and composition guards remain in force. This is not an
application clipboard transport, cross-origin trust assertion, drag import API or
collaboration protocol.

Automated checks: `packages/primitives/tests/editor-clipboard.test.mjs` and
`apps/docs/tests/editor-clipboard.spec.ts`, alongside the existing rich-text suite.
The browser tests exercise handler interoperability and DOM selections across the
three engines. Physical-device clipboard menus, real OS clipboard transfer to
other applications, IME and assistive-technology behavior remain manual review.
