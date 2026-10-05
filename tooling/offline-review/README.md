# Offline theme review packages

Preserve an exported candidate alongside the exact documentation build that owns
it. Reviewers can edit, reopen, compare the full sticker sheet and workflows, and
export a revised candidate without connecting to a service. This tooling does not
submit, approve or adopt a theme. No new library element or public API is added.

## Create and transfer

Keep the original `dist` from the build used to export the candidate. A freshly
rebuilt or currently hosted site may have a different identity, even with the same
package version. Offline serving requires the original **root** build. The separately
built GitHub project-site output has a different deployment identity and absolute
base; it is supported by the visual capture tooling, not by this loopback packager.
Do not remove or rewrite its base to make it look like a root build. From the
repository, with built packages installed:

```sh
tooling/test-pipeline/with-toolchain.sh node tooling/offline-review/package.mjs \
  /absolute/original-dist /absolute/candidate.json /absolute/new-review-package
```

The output directory must not exist. The command checks every original build
asset, rejects extra/missing files and symlinks, compares the complete candidate
build manifest, and verifies the candidate envelope integrity. It copies bytes,
not source paths or browser storage. Single and paired envelopes are accepted.
The preserved application remains the authority for semantic token replay,
trusted preset companions and compiled-artifact validation when the file reopens.
Packaging alone does not certify a candidate's semantics or review coverage.

Transfer the complete output directory privately, or archive that directory with
your normal file-transfer tool. It contains `site/`, `candidate.json`, the
standalone `serve.mjs`, landing page, instructions and `offline-review.json`.
There are no `node_modules`, remote CDN dependencies or auto-updates. Treat the
contents as executable application code; hashes detect corruption, not publisher
identity. Preserve the original manifest through a trusted transfer channel.

## Review without a connection

Install Node 24 or later before going offline. From inside the transferred directory:

```sh
node serve.mjs --verify
node serve.mjs
```

Open the printed `http://127.0.0.1:<port>/offline-review` URL. The server chooses an
available port and listens only on loopback. Do not open the HTML with `file://`:
modules, fetches and the same-origin preview bridge require HTTP. No npm install
or repository checkout is needed on the reviewing computer.

Download the supplied candidate or select the existing `candidate.json` through
Theme Review's **Reopen candidate** control. Choose a preview and **Load previews**.
The same build validates and regenerates the candidate, keeping baseline and
candidate frames separate. Export edits outside the immutable package. Reloading
does not automatically restore a draft or browser session. Use Ctrl+C to stop.

The server verifies the complete package before listening and checks each asset
again before responding. It serves only inventoried docs and the candidate route,
accepts GET/HEAD, validates Host, disables caching, and limits document resource
loading and forms to this origin. External documentation links still require a
connection. This is local review delivery, not a general-purpose web server or a
sandbox for untrusted JavaScript. No authentication service is implied.

## Evidence and limits

`offline-review.json` records exact file hashes, build identity and the candidate's
original integrity value. All review acceptance fields begin `not-run`; packaging
and preview receipts never set them to passed. Share review notes separately with
this manifest and the relevant exported candidate. No telemetry, service worker,
remote persistence, captured session state or adoption transport is introduced.

Automated coverage lives in `offline-review.test.mjs` (package and server controls)
and `apps/docs/tests/offline-review.spec.ts` (real exported candidate, isolated
browser context, blocked external requests and baseline/candidate comparison).
Run the focused workflow through the existing owned test entry point:

```sh
EN_EXECUTION_OUTPUT=/absolute/fresh-run \
  tooling/test-pipeline/with-toolchain.sh npm run test:workflows -w @en-reve/docs -- offline-review.spec.ts
```

The token compiler, original assets and candidate replay are reused unchanged.
Old/new release comparison, managed adoption, formal human acceptance and the
remaining physical/platform matrix remain separate work.

## Submit a theme change through GitHub

GitHub pull requests are the agreed shared submission and adoption workflow.
The offline tools continue to prepare and preview candidates without submitting
anything automatically.

1. Export the candidate and retain its original documentation build. Record the
   candidate source hash and build fingerprint so review comments identify the
   exact proposal. A revised candidate needs a new identity and review context.
2. Apply the intended changes to the authored token/theme inputs on a source
   branch. Reopening a candidate previews it; it does not edit repository files.
   Follow the token and CSS-authoring contracts for generation. Do not copy emitted
   CSS over authored inputs or hand-edit generated adapters.
3. Open a pull request with the [theme-change template](../../.github/PULL_REQUEST_TEMPLATE/theme-change.md).
   Explain the visible change and scopes affected, link the exact candidate/review
   material, and disclose focused verification and remaining manual checks. Keep
   large builds, screenshots and historical evidence outside source history;
   provide accessible review links and identities through the established transfer
   process. Check access before linking private material from a public PR.
4. Review the source diff and matching previews in the PR. Follow existing
   maintainer permissions and repository merge rules; this workflow creates no new
   approver role or bypass. Resolve feedback against the candidate version it
   concerns. Acknowledging a preview is not approval to merge.
5. Merge the approved source change to adopt it. Build and publish through the
   existing delivery process, recording the actual deployed version separately.
   A merged proposal is not necessarily published yet.

No GitHub credential is entered into Theme Review, and no custom submission
backend is required. The distinction remains explicit: **exported → submitted
(PR opened) → adopted (merged) → published (deployed)**. Existing review tools do
not infer those external states from an export or a successful local check.
