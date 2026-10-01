# Family delivery census

This portable Playwright probe inspects unchanged, frozen production consumers for
media, selection, command, menubar, overflow, pagination and toast boundaries. It
uses the matching installed Chromium/Firefox/WebKit engines at 1280×900 and
390×844, fresh isolated contexts, the documented static server, and the existing
machine/checkout/browser ownership leases. It runs no timing or retention work.

Freeze a production docs build with `assets.json` and `receipt.json` beside its
`site` directory. Reserve the shared browser lane with the validation owner. Then:

```sh
EN_EXECUTION_OUTPUT=/absolute/fresh-execution \
EN_FAMILY_CENSUS_SITE=/absolute/frozen/site \
EN_FAMILY_CENSUS_OUTPUT=/absolute/fresh-census \
tooling/test-pipeline/with-toolchain.sh node probes/lazy-delivery-families/census.mjs
```

The census directory must not exist. Real routes/data remain unchanged; no large
catalogs or history entries are seeded. All requests, errors, engine versions,
source hashes, frozen assets and screenshots remain in the receipt. Each family
uses its frozen gate in `plans/lazy-delivery/family-designs.json`.

Deep connected counts include native/custom elements, text/comment nodes and open
shadow roots. They exclude inert template contents, which are not connected.
Generated counts conservatively bound removable subtrees before replacement
markers or status/control overhead. Entire-host counts provide a looser rejection
bound only. Clearing an upper bound never establishes a passing implementation.
Pagination is measured both per instance and across the existing multi-pager route.
Overflow counts are settled DOM only: source initializes count to Infinity, so a
simple later hidden-list guard cannot avoid initial action construction. Toast
history is measured without synthetic messages; empty real history is not a
benefit claim.

`census.json` and `partial.json` retain every attempted cell, including failures.
Source/build mutation or missing/changed workload fails the run. Desktop engines
at phone width do not establish physical touch, OS picker, IME, assistive technology
or manual acceptance. This probe provides deterministic eligibility evidence only.
