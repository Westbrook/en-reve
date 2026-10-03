# GitHub Pages deployment paths

The reported missing base was present in every published HTML document. The real
failure was `/assets/...`: an origin-root URL ignores `<base>` and returned 404,
while the matching `/en-reve/assets/...` returned 200.

## Implemented contract

- Build client and SSR documentation with the same explicit deployment prefix.
  Vite owns asset imports; a documentation-only source transform handles known
  routes/fetches without rewriting editor `/` triggers or arbitrary content.
- Bind all static and rendered HTML to the requested absolute base before review
  fingerprints and transport hashes. Handbook artifact URLs use the same prefix.
- Preserve document-local fragments under that absolute base, including native
  activation of links authored after hydration. Root/private builds are separate.
- Publish already-qualified bytes. Reject missing/conflicting base tags, root
  builds, changed inputs or mismatched review asset hashes before any push.

## Qualification

The six subpath browser cases pass across pinned Chromium, Firefox and WebKit.
They route actual build bytes at `https://westbrook.github.io/en-reve/` and reject
all resource requests outside that prefix. They exercise root navigation, nested
calendar interactions, rich-editor slash commands, local fragments, review frame
loading and candidate export, and verify every review manifest asset plus handbook
artifact hashes. Fourteen Node checks, two publishing checks and the docs semantic
gate pass. Initial build failure (missing declaration) and two test harness failures
(navigation wait and wrong host selector) are retained separately.

A fresh private-root build and 12 existing handbook/review regression cases across
all three engines also pass. Final exact hashes, results and output locations
are recorded in `apps/docs/tests/verification-github-pages-20261003.json`.

These are automated deployment-path checks, not broad component requalification,
physical browser testing or manual accessibility acceptance. Large evidence stays
in the independent report; source-only GitHub history remains intact.
