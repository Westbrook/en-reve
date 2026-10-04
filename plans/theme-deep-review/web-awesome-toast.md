# Web Awesome toast leading rail

The dated review baseline is October 3, 2026, En Reve `11edea37a68413869bae98fc729e13f5f0e3216c`. The canonical source is the isolated installed `@awesome.me/webawesome@3.13.0`, Default theme, Default palette.

The source has an unconditional, nonshrinking **4px leading accent child inside its 1px border**. The medium content inset is 1rem; the surface is raised, with medium corners and large elevation. These surface mappings were already present at the dated review baseline. At that baseline, the missing rail was an expressible decorative gap, not an absent public API or a source generation difference.

| Source observation | Implementation |
| --- | --- |
| `.accent` width 4px; source flex direction follows inherited bidi | `toast/toast-accent-rail` paints one 4px padding-box gradient at logical start on `en-toast::part(base)` and `.en-toast`; the second background layer retains the existing border-box plate |
| Explicit brand/success/warning/danger use palette scale 50 in both appearances | Independent finite colors: `#0071ec`, `#00883c`, `#b45f04`, `#dc3146`; rail paint does not borrow the existing stronger icon text tones |
| Rail occupies space before icon/content | The existing first auto grid column gains 4px via the public icon's logical margin. Native markup that omits its immediate icon spans the first two tracks for content/actions and applies the same logical margin. Existing flex-based toast recipes retain the icon margin. |
| Source medium padding 16px at the normal 16px root | Existing `--en-toast-padding` is unchanged, including one-to-four-value shorthands. Default local icon start is border 1 + padding 16 + rail 4 = 21px. The iconless native body has the same 21px leading inset. Source icon scale 1.25 and icon/content gap 1rem are finite roles: at the default 16px font, the glyph is 20px with a 16px gap. |
| Raised plate and neutral border remain separate from rail | Public status-background → general-background overrides remain first in the final layer, accepting color **or gradient** paint. Border, radius, shadow, text and close target properties remain owned by the existing toast. |

The source default is **neutral without an icon**, with a 5000ms duration. En Reve defaults to **info with its existing semantic icon** and persistent/actionable behavior. This mapping deliberately translates local info to the source's explicit brand variant; it does not call blue the upstream default. Source neutral loud fill would be `#2f323f` light and `#e4e5e9` dark. Local semantic icon shapes and stronger icon text tones remain. The public `--en-icon-size` remains authoritative. Source-relative icon scale follows the delivered icon font context, including inherited public typography overrides. Native source canvas geometry uses the documented `.en-icon` helper inside `.en-toast__icon`; arbitrary application artwork retains its own authored sizing. EnIcon has its own foundation typography: raw `font-size` set only on an ancestor or the toast icon Part does not replace that child foundation; a public typography override updates both contexts. No private computed-length bridge is introduced. The native omitted-icon correction uses only the documented helper body/content/actions classes; present-but-hidden authored icons retain their existing grid semantics.

This correction adds no source progress-ring timer, animation choreography, announcement behavior, swipe gesture, queue policy or dismissal API. The decorative rail and its space reservation are suppressed in forced colors so the owning system-color presentation and grid remain intact. Existing `::before`/`::after` queue layers are not repurposed. Background layers naturally appear on those inherited stack decorations without entering private shadow structure.

The finite presenter is opt-in. It is mapped only for Web Awesome; other theme definitions and unpinned default toast behavior remain untouched. [web-awesome-toast-update.py](web-awesome-toast-update.py) is an idempotent, importable updater for serial definition updates; direct execution previews only. It does not rewrite canonical recipe input arrays or existing padding/status pins.

## Pinned evidence

Paths below are relative to the isolated installed package. URLs identify versioned distributed source; the inspected bytes are the local installation, not a fresh web acquisition.

| File | Relevant lines | SHA256 |
| --- | --- | --- |
| [dist/chunks/chunk.6AMLOZPA.js](https://cdn.jsdelivr.net/npm/@awesome.me/webawesome@3.13.0/dist/chunks/chunk.6AMLOZPA.js) |7–10 width/color,24–26 medium padding,36–43 plate,77–95 accent/icon | `b98bbf12eb67724235bfa6583234ff6adb40164d9f70bceef29e83b2c7c5c05d` |
| [dist/chunks/chunk.HANETBI3.js](https://cdn.jsdelivr.net/npm/@awesome.me/webawesome@3.13.0/dist/chunks/chunk.HANETBI3.js) |59–62 defaults,159–179 rendered unconditional accent | `a54078d91f392ae41f44bf61c31fdf8b015138f4cb0f562aee01198d1a3fc498` |
| [dist/styles/themes/default.css](https://cdn.jsdelivr.net/npm/@awesome.me/webawesome@3.13.0/dist/styles/themes/default.css) |41/51/61/71 light and125/135/145/155 dark fill-loud aliases | `e19fff39b8c90f37d39e76535313e6da23f02cf2ca3b0e67407e17022fa6da50` |
| [dist/styles/color/palettes/default.css](https://cdn.jsdelivr.net/npm/@awesome.me/webawesome@3.13.0/dist/styles/color/palettes/default.css) |81 brand,53 success,39 warning,11 danger | `7fd5825d4872d2085ecce86776d3d5383c606882d5667f6f3105f04b15ccd69e` |

The variant alias files map brand→blue, success→green, warning→yellow and danger→red at scale 50. Their inspected SHA256 values are respectively `a2829831037fadd78d69a39307a3a0245a12e26b7919481e08cf2e0fee1a2d92`, `028d7e2f51c88154437ba21c01c6441be3dad3a5f25e7f5803adcce06a90e0a8`, `b10bd5c41c3ca783d4389685ac0946367e67a1c04b4ae2f995959504b179ec49`, and `0cb3bf4318de4819bfd1cfe381ed8c708c7a38c34345dcb2bb4a32c596f43377`.

## Verification scope

The compiler regression checks typed roles, public custom/native selectors, theme boundaries, RTL, forced-color gating, hook fallback order, and omission safety. The browser regression uses the real downloaded theme CSS on hydrated public components and the native toast CSS export. Independently sourced raster expectations distinguish the 1px border from the next 4px rail, exact light/dark variant colors, direction and ordinary plate pixels. It also exercises four-value padding, inherited status/general and gradient paint, 20px glyph/16px gap, 30px glyph under inherited public 24px typography, explicit icon-size overrides, direct public-Part overrides, nested full-theme boundaries, restored defaults, close target floors and cancelable/accepted dismissals.

Qualification scope includes the complete source-fidelity owner across Chromium, Firefox and WebKit, relevant toast/public behavior owners, token/compiler tests and docs semantic types. Generated API/type/catalogue changes follow the maintained freshness workflow. Qualification evidence is recorded in [verification-20261003.json](verification-20261003.json); consult its candidate-specific receipts for commands, results and limits.
