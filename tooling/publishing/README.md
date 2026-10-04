# GitHub build snapshots

After each GitHub source publication, publish a separately qualified project-site
build to `gh-pages`. Keep the root/private build separate:

```sh
# Once per checkout or reader lockfile change; preserve its isolated dependencies.
tooling/test-pipeline/with-toolchain.sh npm --prefix showcases/performance-results ci --workspaces=false

EN_DOCS_BASE_PATH=/en-reve/ EN_DOCS_OUTPUT=/absolute/path/to/github-dist \
  tooling/test-pipeline/with-toolchain.sh npm run build -w @en-reve/docs
```

Use the normal execution-owner/receipt wrapper and a fresh evidence directory.
The shared client/SSR deployment transform prefixes documentation URLs, while
Vite prefixes executable and stylesheet assets. Build finalization adds exactly
`<base href="https://westbrook.github.io/en-reve/">` first in each HTML head,
binds static same-document fragments and handbook URLs, then seals review hashes.
Hydrated fragment links retain native same-document navigation. Source examples
and editor slash triggers remain source content. With no deployment configuration,
the private/root build retains its existing URLs and contains no base element.

The `/en-reve/` build also builds the independent performance reader at
`/en-reve/performance/`, linked from the sticker sheet. It renders the canonical
`plans/native-showcase-performance-results.md` and copies its explicitly linked
documents. This includes the latest completed dated main/peer and calendar
results; it does not acquire measurements, relabel old samples as current, or
repack frozen comparison dependencies. `PERF_REPORT_SOURCE` overrides are ignored
for this publication. Root/private docs builds remain independent of the reader.
The two explicitly linked `baseline.json` / `summary.json` files beneath
`showcases/performance/baselines/exploratory-mobile-cold-2026-09-20/` are compact,
unchanged historical evidence retained for the reader; including them does not
promote a timing baseline or restore the omitted acquisition archives.

The viewer, Markdown download and linked evidence are included before review
hashes are sealed. `performance/source.json` binds their hashes, viewer source,
lockfile and frozen package inputs. The publisher rejects missing output or
source/evidence changes and records the report identity in `.en-reve-build.json`.

Qualify `deployment-paths.test.mjs`, document-style tests and
`github-pages.spec.ts` against the isolated output (`EN_GITHUB_PAGES_BUILD`).
The browser fixture serves exact output bytes at the real project prefix and
rejects requests outside it. Retain its engine matrix and every manifest hash.
Its performance cases cover source/evidence delivery, section navigation with
the project base, sorting, downloads, narrow layout and the static fallback.
Run the publisher tests as well: `python3 tooling/publishing/publish-github-build.test.py`.

Commit local `main`, push its source-only export, then publish:

```sh
tooling/test-pipeline/with-toolchain.sh python3 tooling/publishing/publish-github-build.py \
  --repository /absolute/path/to/source-only-export \
  --build /absolute/path/to/github-dist \
  --receipt /absolute/path/to/passing-build-receipt.json
```

The publisher requires a clean source checkout, GitHub `main` bound to that source
commit, matching receipt input/generated hashes, passing SSR qualification and an
exact output manifest. It also requires the project-site deployment identity,
matching review asset hashes and the exact base already in every HTML head.
It **never mutates qualified HTML**; a root build is rejected. Receipt fields are
`status`, `inputs`, `generatedModules`, `productionBuild.SSRBuild`, `distFiles` and
`distManifestSHA256` (see documentation verification receipts).

The branch contains qualified output, `.nojekyll` and `.en-reve-build.json` with
source, receipt and manifest provenance. Its first commit is parentless; later
snapshots retain history through ordinary fast-forward pushes. Temporary indexes
and refs leave developer checkouts untouched. A concurrent publication fails for
retry; no force push is used. Repository visibility and Pages configuration are
not changed. Continue publishing the **root** build to the existing private Site.
