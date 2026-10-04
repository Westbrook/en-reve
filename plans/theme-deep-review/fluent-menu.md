# Fluent ordinary-menu intrinsic width correction

The dated review baseline is October 3, 2026, En Reve `11edea37a68413869bae98fc729e13f5f0e3216c`. The canonical Fluent website typography and rose identity remain intact; these geometry values come from the pinned product component implementation.

The retained `@fluentui/react-components` **9.74.7** fixture installs `@fluentui/react-menu` **9.25.4**. Its `lib/components/MenuPopover/useMenuPopoverStyles.styles.raw.js` lines 12–16 sets border-box sizing, **138px minimum**, **300px maximum**, and **max-content width**. Both appearances use that geometry. The [official menu usage guidance](https://fluent2.microsoft.design/components/web/react/core/menu/usage) provides behavioral context; the pinned distributed component source establishes these exact dimensions.

At the dated review baseline, En Reve `packages/styles/src/commands.ts` already used `max-content`, but its shared minimum/maximum defaulted to `layout.panel-preferred` / `layout.form-max` (320px/448px at the normal root). Merely setting the existing maximum hook to 300px would still make short menus 300px wide. The source profile therefore requires an independent minimum as well.

The implementation adds optional `component.menu.min-inline-size` / `component.menu.max-inline-size` roles and their documented `--en-menu-min-inline-size` / `--en-menu-max-inline-size` hooks. Both are consumed **only by ordinary command-menu surfaces**. `fluent-menu-update.py` pins 138px/300px in both Fluent appearances, without changing shared layout roles or other themes. Unpinned full themes emit `initial`; partial themes preserve unspecified inputs. Native `.en-menu` and custom menu surfaces use the same authored command stylesheet. No companion reads private DOM or mechanical variables.

Existing `--en-overlay-max-inline-size` remains an explicit override above the source menu maximum fallback. The normal minimum is capped by that effective maximum and the controller's measured viewport, and the maximum retains the same viewport cap. Public Part or native-class CSS remains available. The new ordinary-menu selector excludes replacement submenus; their existing controller-owned parent width, viewport calculations, back action and focus lifecycle are unchanged. The existing source 2px menu gap is untouched. Comboboxes and command-palette shells receive no width changes.

The menu stylesheet is authored TypeScript and is **not** listed in `packages/styles/css-authoring.json`. The normal styles build generates its portable `commands.css` from the authored stylesheet. The optional properties participate in the maintained metadata, manifest, customization and public-API generation and freshness workflow.

Regression coverage includes pin round-trip, optional full reset/partial preservation, public contract registration, and independent browser literals for short and long menus, intrinsic intermediate content, public/inherited maximum overrides, narrow viewport fitting, native/custom delivery and replacement-submenu width. Browser native-helper geometry uses ordinary consumer CSS to establish its fixture layout; it does not claim that CSS implements popup behavior. Custom cases exercise the actual native-popover lifecycle. Qualification evidence is recorded in [verification-20261003.json](verification-20261003.json); consult its candidate-specific receipts for commands, results and limits.

Pinned source files are beneath `/Users/westbrook/Documents/repos/design-system/showcases/fluent-react/node_modules`:

| Source | SHA256 |
| --- | --- |
| `@fluentui/react-components/package.json` | `8b0fc6ecfd62c79b8a91073c9bab8987335da2d8c4ef10c5a3df194a646dfdd1` |
| `@fluentui/react-menu/package.json` | `67f35b1c61519b307d78cb5210fe96096d8b8a9fce3ab76d485d2b4b4d8bba71` |
| `@fluentui/react-menu/lib/components/MenuPopover/useMenuPopoverStyles.styles.raw.js` | `607552202814a62b25ff605e1fb7308a0607ff4aabe220ddbeb48c5757a486c2` |

Remaining adaptations: source min/max are literal CSS pixels, while En Reve target floors and text growth can increase row heights; measured viewport fitting can lower the minimum. Native consumer semantics, custom cancellation/placement and replacement submenus remain En Reve behavior. This correction does not claim full Fluent menu variants, source submenu choreography or focus equivalence.
