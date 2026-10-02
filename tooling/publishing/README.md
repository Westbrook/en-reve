# GitHub build snapshots

After each GitHub source publication, publish the same qualified site build to
`gh-pages`. This is the user's standing publication preference. Keep the source-only
`main` export and full local evidence history unchanged.

```sh
tooling/test-pipeline/with-toolchain.sh python3 tooling/publishing/publish-github-build.py \
  --repository /absolute/path/to/source-only-export \
  --build /absolute/path/to/qualified/dist \
  --receipt /absolute/path/to/passing-build-receipt.json
```

Run from the clean local source checkout (`--source` can name it explicitly).
First commit to local `main` and push through the existing source-only export.
The publisher checks that GitHub `main`'s export manifest identifies that source
commit, that the receipt's qualified inputs/generated modules still match, and
that every static file matches the qualified build manifest. Build receipts use
the existing docs verification format (`status`, `inputs`, `generatedModules`,
`productionBuild.SSRBuild`, `distFiles`, `distManifestSHA256`). A build may be reused
for publishing-tool/docs-only changes when these checks still pass; changed
application output needs a new qualified build and receipt.

The publisher verifies the exact qualified build first, then adds
`<base href="https://westbrook.github.io/en-reve/">` as the first item in each
HTML document’s `<head>`. This GitHub-only transformation leaves the qualified
local output and private Sites build untouched. It is idempotent for the same
base and rejects missing/ambiguous heads or conflicting base tags.

The branch contains that derived build at its root, `.nojekyll`, and
`.en-reve-build.json` linking the local/GitHub source commits, receipt and build
manifest. Provenance records both `qualifiedBuildManifestSHA256` (original) and
`buildManifestSHA256` (published), the base URL and affected HTML count.
Its first commit is parentless, avoiding source/evidence history;
subsequent snapshots retain `gh-pages` history through ordinary fast-forward
pushes. An identical publication does not create a duplicate commit. The script
uses a temporary index and refs, leaving developer checkouts and indexes alone.
A concurrent source/build update causes a retry, never a force push.

This stores build artifacts. It does not enable GitHub Pages, change repository
visibility, or rewrite root-relative asset URLs for a project-site subpath.
Continue publishing the existing Sites review deployment through its normal
workflow. Retain the returned branch commit and build digest in the independent
Progress Report alongside the source and Sites publication receipts.
