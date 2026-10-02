# Packed native calendar recipes

This application-owned date/range grid uses public calendar helpers and calendar
styles from installed tarballs, with no owning-element or workspace-source import.
The fixture, strict packed type resolution, bundle provenance and portable CSS
are prepared in an isolated output directory.

```sh
EN_EXECUTION_OUTPUT=/absolute/non-existing/run \
  tooling/test-pipeline/with-toolchain.sh npm run test:union -- \
  --pathways=calendar-recipes
```

The pathway reserves its own loopback port and retains Chromium, Firefox and
WebKit projects, isolated contexts and zero retries. [The contract](../../packages/primitives/docs/calendar-consumers.md)
separates pure helper behavior from the application's keyboard/selection policies.

[verification-20261002.json](verification-20261002.json) records 120 cases across
both stylesheets and all three engines: grid semantics; native selection/FormData;
leap/month navigation; Home/End and month/year paging; bounds; reversed/malformed
bounds; fractional helper/native observations; whole-day native parity; reverse
ranges; preview/Escape; cross-month ranges; connected band and hover geometry;
scoped pins; localization; RTL; focus/node retention; year edges; narrow enlarged
layout; forced-color boundaries; and browser timezone independence.39 Node checks
include the existing pure date cases and inventory/pathway controls. Strict semantic
and packed types pass separately.

Run01 caught an invalid assertion overload in the test. Run02 exposed overly broad
status locators (native output also has status semantics), a mistaken fixture
radius expectation, native fractional-step differences and WebKit's absent
forced-color-adjust property. These observations remain retained; the final run
names status regions, checks the actual foundation radius, records fractional
native results separately, tests whole-day native parity and explicitly annotates
the unsupported CSS property. Year-edge blank cells are never marked selected.
No production library implementation changed.

Three further entries are qualified for named scenarios: calendar helpers and
calendar `.js`/`.css`. The public-entry inventory is62/110;48 remain. This does not
close physical/manual, retail/alternate-OS, hydration or separate-owner obligations.
