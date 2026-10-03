# GitHub build snapshots

After each GitHub source publication, publish a separately qualified project-site
build to `gh-pages`. Keep the root/private build separate:

```sh
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

Qualify `deployment-paths.test.mjs`, document-style tests and
`github-pages.spec.ts` against the isolated output (`EN_GITHUB_PAGES_BUILD`).
The browser fixture serves exact output bytes at the real project prefix and
rejects requests outside it. Retain its engine matrix and every manifest hash.

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
