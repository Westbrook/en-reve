# Active tool target refresh · September 27, 2026

This is the current target delta after the September 25 inventory and subsequent
compiler migration. It does not rewrite earlier install, test or timing evidence.
The final composed installation and affected validation are still pending.

| Owner | Tool | Earlier selected | Current target |
| --- | --- | --- | --- |
| Root | html-minifier-next | 8.5.3 | 8.6.0 |
| Root | @types/node | 24.13.6 | 24.19.0 |
| showcases/performance | simple-statistics | 7.12.0 | 7.12.1 |

Targets were read from the primary npm registry on September 27. Node types stay
on the supported Node 24 line; the registry-wide latest 26.6.3 is a different line.
Node Current 26.10.0, LTS 24.21.0, npm 12.1.0 and Python 3.14.7 remain unchanged.
All other previously inventoried active tool targets were rechecked.

The minifier adds an optional collapseNoBreakSpaces setting. The template plugin
explicitly leaves it disabled to preserve authored word gaps around nonbreaking,
narrow nonbreaking and figure spaces. Its regression renders both original and
minified Lit templates through SSR, then checks parsed text including expression
boundaries. Run the full focused minifier suite and production SSR/hydration
fixtures after installation; declaration changes also require typechecks.

The statistics release changes combinations, Jenks classification, scaled root
mean square, weighted mean and ESM declaration specifiers. The performance
analysis imports median and quantile, whose published source is unchanged.
Nevertheless, clean installation, analysis/unit checks and fresh report generation
remain required. New reports must disclose 7.12.1; retained observations and their
original tool identities stay immutable and are not pooled with new campaigns.

Regenerate root and performance lockfiles with npm 12.1.0 and prove clean installs.
The separately owned results-reader final install/build remains required too.
Preserve all frozen reader/native vendor archives and historical locks exactly.
Only the three new CEM private archives are rebuilt for the compiler migration.

Primary sources: [minifier](https://registry.npmjs.org/html-minifier-next/8.6.0),
[statistics](https://registry.npmjs.org/simple-statistics/7.12.1), and
[Node 24 types](https://registry.npmjs.org/@types/node/24.19.0).
