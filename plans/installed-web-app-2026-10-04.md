# En Rêve installed web app — October 4, 2026

Home Screen support is published to the private documentation Site and pushed to
GitHub `main` and `gh-pages`. Both production builds and all 12 focused browser
cases pass. Physical iPhone/iPad installation acceptance remains open.

## Published checkpoint — October 5, 2026

- Product source: `894ff8bca8685589996a187c016195906fae251b`.
- GitHub source/provenance: `89fd3cf7d66bb5696d2a7546ef3b6c034d6095c2`.
- Static `gh-pages` build: `8ae818be018d2e2024c4561e0a143a0ad4b1076f`; all
  82 HTML documents contain `<base href="https://westbrook.github.io/en-reve/">`.
- Private Site deployment: `appgdep_6ac341c9763c8191aff532ab22c49bcb`, succeeded.
- Focused browser evidence: `/private/tmp/en-installed-app-browser-20261005-01`,
  four cases each in Chromium, Firefox and WebKit; no failures, skips or retries.
  These cover manifest identity, decoded icons and safe-area geometry.

The root build passed on the first attempt. The initial project-path build found
missing dependencies for the independently installed performance reader. After
installing its own lockfile, only that build was repeated; the root build was
retained. The failed attempt remains recorded.

Next: physical-device review using `apps/docs/INSTALLATION.md`. Browser emulation
does not establish installation, native shell, multitasking or hardware safe-area
acceptance. The earlier checkpoints below are retained history and are superseded
by this publication checkpoint.

## Delivered

- Shared `manifest.json`: stable app identity, root launch, deployment-local scope,
  standalone display, language, colors, regular/maskable icons and three shortcuts.
- Vite head integration for all authored/generated pages in development and builds,
  including credentialed manifest requests for private hosts, Apple compatibility
  metadata, a touch icon and zoom-enabled edge-to-edge viewport settings.
- SVG/PNG blue-gradient En Rêve icons, with an opaque mask-safe Home Screen tile
  and a larger small-favicon mark. Raster generator uses sharp 0.35.4 separately
  from application dependencies.
- Shared safe-area padding, adjusted full-height shells and a safe-area-aware
  keyboard skip link. No orientation lock or global touch/zoom suppression.
- Installation, hosting and physical-device acceptance guide:
  `apps/docs/INSTALLATION.md`.

## Evidence

Four Node tests passed: all existing HTML shells, root/subpath manifest identity
and URL resolution, declared PNG dimensions, and actual SSR stylesheet inlining
with install metadata preservation. Exact command and logs:
`/private/tmp/en-installed-app-node-20261004-03/receipt.json` and `command.log`.

The same four Node checks passed again after transfer onto current `main`; receipt:
`/private/tmp/en-installed-app-main-node-20261004-01/receipt.json`. The newer
GitHub Pages deployment plugin and other main-branch changes were preserved.

Docs TypeScript check passed (`tsc --noEmit -p apps/docs/tsconfig.json`):
`/private/tmp/en-installed-app-types-20261004-01/receipt.json`.
Targeted `git diff --check` passed. The generated 512px icon was visually inspected.

The supported browser gate was attempted with:

```sh
EN_EXECUTION_OUTPUT=/private/tmp/en-installed-app-browser-20261004-01 \
  tooling/test-pipeline/with-toolchain.sh npm run test:workflows -w @en-reve/docs -- web-app.spec.ts
```

It stopped before execution because PID 72744 owned the machine lease for a
separate catalogue campaign. No browser tests ran; no execution output directory
was created. The existing build and lease were left intact. The new cases remain
in the standard Chromium/Firefox/WebKit workflow suite. Four Node cases are also
registered in the extended Node suite.

## Earlier pre-publication next action

After the existing machine lease is released, build the docs through the supported
owned validation workflow, then run the filtered browser suite with a fresh output
directory. Fix any failures before publication. Review installation from the Home
Screen on a physical iPhone and iPad: icon/title, browser chrome, page navigation,
rotation, iPad multitasking, keyboard and safe-area controls. Playwright geometry
checks cannot establish those native-shell results.

Offline caching is not added. Installation still uses the deployed host and its
authentication. Apple controls system bars and installation requires the user's
Add to Home Screen action. The user requested a local commit to `main`; push and deployment remain for the next build/publication phase.

## Source-only publication integration — October 5, 2026

The completed local implementation from `3fe84b08` is integrated on top of the
GitHub source-only history at `0336b8d`. All 22 delivered paths are preserved;
the workflow configuration retains both the Home Screen tests and the newer
capture-diagnostic tests. This transfer does not modify the source or build used
by the active catalogue campaign.

The prior four Node checks and docs type result remain scoped to their recorded
source. No repeat broad suite is required for the transfer. Production builds,
the focused Home Screen browser checks, publication to both hosts, and physical
iPhone/iPad review remain outstanding. The physical review can follow publication
and is not implied by browser emulation.
