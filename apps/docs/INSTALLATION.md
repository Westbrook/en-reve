# Install En Rêve on iPad or iPhone

Open the deployed HTTPS site in Safari, open Share, then choose **Add to Home
Screen**. If Safari offers **Open as Web App**, leave it enabled. Tap Add, then
launch **En Rêve** from its Home Screen icon. This removes Safari's address and
tool bars. Apple still controls the status bar, Home indicator and multitasking
window controls; this is not a kiosk or an arbitrary tab fullscreen API.

The same site works normally in browser tabs. Installation is a user action;
websites cannot silently install themselves on iOS/iPadOS. Other browsers can
also offer Home Screen installation. Desktop and Android browsers can use their
own installation menu. Shortcuts are used on platforms that support them.

## Delivery contract

`public/manifest.json` declares a stable relative ID, launch URL and scope, names,
language, colors, standalone display, regular and maskable PNG icons, and links
to the Showcase, Component API and Theme Review. Relative manifest members keep
root and subpath installations separate and inside their deployment. All docs
pages share this identity; installing from a nested example still launches the
sticker sheet. Orientation is unrestricted for iPad multitasking and rotation.

The Vite `webAppPlugin` adds manifest/icon links and Apple compatibility metadata and credentialed manifest fetching
to every authored and generated page in development and production, before SSR
finalization. Its asset URLs respect Vite's deployment base. Host the manifest
and icons at that base; never redirect them to an HTML fallback. Serve JSON as
`application/json` or `application/manifest+json` and PNGs as `image/png`.
Publication systems that rewrite root asset URLs must also rewrite the manifest,
Apple icon and installed-app stylesheet links. Manifest members remain relative.

`viewport-fit=cover` and the shared safe-area stylesheet reserve cutout and Home
indicator space. Full-height docs shells subtract these insets. Pinch zoom,
selection and native scrolling stay available. The normal system status-bar
style avoids hard-coding a light/dark status treatment across selectable themes.

This change does not add offline caching or promise offline operation. The app
still requires its host and any host authentication. A service worker is not
needed for Apple's Home Screen launch; caching this private, changing reference
site needs its own update and offline-content design.

## Icons

The vector source is `assets/app-icon.svg`, based on the existing En Rêve mark.
The opaque gradient tile has a mark inside the maskable safe circle; the OS
supplies its own corner mask. Browser favicons use a larger mark for legibility.
Checked-in raster outputs are 32, 180, 192 and 512 pixels. Regenerate with the
pinned runtime and a separately installed **sharp 0.35.4** module:

```sh
tooling/test-pipeline/with-toolchain.sh node apps/docs/scripts/generate-app-icons.mjs /absolute/path/to/sharp/dist/index.cjs
```

App builds do not require sharp. Review both the small favicon and the Home
Screen icon after changing either vector source.

## Qualification

Node checks: `apps/docs/tests/web-app.test.mjs`, also selected by `test:extended:node`. The production browser cases
are included in the existing docs workflow suite; use its supported public gate
with `web-app.spec.ts` as the filter and a fresh `EN_EXECUTION_OUTPUT` directory.
Respect checkout and machine leases before builds or browser runs.

Physical acceptance remains separate from Playwright: install on an iPhone and
an iPad, launch from the icon, verify title/icon/chrome, navigate between pages,
rotate, try iPad multitasking, open a text field with the software keyboard, and
check controls around screen cutouts and the Home indicator. Re-add an older
installation if the OS retains its previous icon or launch metadata.

References: [Apple Home Screen configuration](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html),
[WebKit Home Screen manifest support](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/),
[Safari 26 installation choices](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/).
