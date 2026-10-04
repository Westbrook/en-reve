#!/usr/bin/env python3
"""Prepare bounded default inline-alert presentations for six inspired themes.

Import update(definition) for coordinated serial application. The command-line
entry point prints a preview only; it never writes definitions or runs checks.
Chakra UI, Holotable and every other definition are explicitly out of scope.
"""
from __future__ import annotations

import argparse
import copy
import json
from pathlib import Path


def dimension(value: float, unit: str = "px") -> dict:
    return {"$type": "dimension", "$value": {"value": value, "unit": unit}}


def number(value: float) -> dict:
    return {"$type": "number", "$value": value}


def weight(value: int) -> dict:
    return {"$type": "fontWeight", "$value": value}


def token_name(role: str) -> str:
    """Keep role API camelCase while storing valid lowercase token path leaves."""
    return "".join("-" + character.lower() if character.isupper() else character for character in role)


def color(hex_value: str | tuple[str, float]) -> dict:
    """Preserve source sRGB alpha, including Radix's translucent A3/A11 roles."""
    exact_alpha = None
    if isinstance(hex_value, tuple):
        hex_value, exact_alpha = hex_value
    if len(hex_value) not in (7, 9) or not hex_value.startswith("#"):
        raise ValueError("Expected a six- or eight-digit sRGB hexadecimal color.")
    return {"$type": "color", "$value": {
        "colorSpace": "srgb",
        "components": [int(hex_value[i:i + 2], 16) / 255 for i in (1, 3, 5)],
        "alpha": exact_alpha if exact_alpha is not None else int(hex_value[7:9], 16) / 255 if len(hex_value) == 9 else 1,
    }}


# Each paint tuple is background, body ink, border, icon ink. Plate profiles do
# not supply a default border; an explicit public author border can remain an
# inset ring without changing the source's borderless box geometry.
PROFILES = {
    "spectrum-inspired": {
        "presentation": "outlined-trailing",
        "geometry": {
            "paddingBlock": dimension(24), "paddingInline": dimension(24),
            "radius": dimension(0.625, "rem"), "borderWidth": dimension(2),
            "fontSize": dimension(0.875, "rem"), "lineHeight": number(1.5),
            "weight": weight(400), "iconSize": dimension(1.25, "rem"),
        },
        "paints": {
            "light": {
                "info": ("#ffffff", "#292929", "#4b75ff", "#4b75ff"),
                "success": ("#ffffff", "#292929", "#0ba45d", "#079355"),
                "warning": ("#ffffff", "#292929", "#e86a00", "#d45b00"),
                "danger": ("#ffffff", "#292929", "#f03823", "#f03823"),
            },
            "dark": {
                "info": ("#111111", "#dbdbdb", "#4069fd", "#5681ff"),
                "success": ("#111111", "#dbdbdb", "#047c4b", "#099d59"),
                "warning": ("#111111", "#dbdbdb", "#b94900", "#e06400"),
                "danger": ("#111111", "#dbdbdb", "#df3422", "#fc432e"),
            },
        },
        "sourceVersion": "@react-spectrum/s2 1.7.1",
        "sources": [
            "src/InlineAlert.tsx:60-200; dist/private/InlineAlert.css",
            "icons/Icon.css; style/spectrum-theme.ts",
            "https://github.com/adobe/react-spectrum/blob/4dd44e0f400636a87a9ad4390903e78c5ae6113c/packages/%40react-spectrum/s2/src/InlineAlert.tsx",
        ],
        "adaptations": [
            "Local info maps to source informative; the source's initial neutral variant and subtleFill/boldFill vocabulary are not added.",
            "The trailing icon uses existing public Parts; a separate icon column approximates source inline-end float wrapping.",
            "The single authored content slot receives source body typography; source heading/content contexts and automatic status icons remain authored composition differences.",
            "Source padding and stroke retain px units; radius, body type and icon retain rem units at the standard desktop scale.",
        ],
    },
    "fluent-inspired": {
        "presentation": "outlined",
        "geometry": {
            "paddingBlock": dimension(7), "paddingInline": dimension(12),
            "gap": dimension(8), "radius": dimension(4),
            "borderWidth": dimension(1), "minHeight": dimension(36),
            "fontSize": dimension(0.875, "rem"), "lineHeight": number(10 / 7),
            "weight": weight(400), "iconSize": dimension(1.25, "rem"),
        },
        "paints": {
            "light": {
                "info": ("#f5f5f5", "#242424", "#d1d1d1", "#616161"),
                "success": ("#f1faf1", "#242424", "#9fd89f", "#0e700e"),
                "warning": ("#fff9f5", "#242424", "#fdcfb4", "#bc4b09"),
                "danger": ("#fdf3f4", "#242424", "#eeacb2", "#b10e1c"),
            },
            "dark": {
                "info": ("#141414", "#ffffff", "#666666", "#adadad"),
                "success": ("#052505", "#ffffff", "#107c10", "#54b054"),
                "warning": ("#4a1e04", "#ffffff", "#f7630c", "#f98845"),
                "danger": ("#3b0509", "#ffffff", "#c50f1f", "#dc626d"),
            },
        },
        "sourceVersion": "@fluentui/react-message-bar 9.7.6 via @fluentui/react-components 9.74.7; @fluentui/tokens 1.0.0-alpha.24",
        "sources": [
            "lib/components/MessageBar/useMessageBarStyles.styles.raw.js:9-83",
            "lib/components/MessageBarBody/useMessageBarBodyStyles.styles.raw.js:7-10",
            "@fluentui/tokens/lib/alias/{lightColor,darkColor,lightColorPalette,darkColorPalette}.js; lib/global/{colors,spacings,fonts,borderRadius}.js",
        ],
        "adaptations": [
            "Seven-pixel block insets derive from the source centered 36px single-line box, one-pixel edges and 20px body; wrapping remains naturally supported.",
            "The source's ResizeObserver-controlled single/multiline layout, title and secondary-action slots are not introduced by a theme.",
            "Product neutral/status roles supplement the retained website rose identity; no product-default blue brand replacement is implied.",
            "Source 14px type and 20px icon use equivalent rem units locally so root text growth enlarges both; source box geometry remains in px.",
            "The optional dismiss control retains local protected targets and can increase the bar's minimum practical height.",
        ],
    },
    "astryx-inspired": {
        "presentation": "plate",
        "geometry": {
            "paddingBlock": dimension(12), "paddingInline": dimension(16),
            "gap": dimension(8), "radius": dimension(16),
            "borderWidth": dimension(0), "fontSize": dimension(0.875, "rem"),
            "lineHeight": number(10 / 7), "weight": weight(600),
            "iconSize": dimension(1.25, "rem"),
        },
        "paints": {
            "light": {
                "info": (("#15110c", 0.08), "#15110c", None, "#15110c"),
                "success": ("#0b991f33", "#15110c", None, "#0d8626"),
                "warning": ("#e2a40033", "#15110c", None, "#e9af08"),
                "danger": ("#e3193b33", "#15110c", None, "#e3193b"),
            },
            "dark": {
                "info": (("#dfe2e5", 0.14), "#dfe2e5", None, "#dfe2e5"),
                "success": ("#0b991f3f", "#dfe2e5", None, "#0d8626"),
                "warning": ("#e2a4003f", "#dfe2e5", None, "#f2c00b"),
                "danger": ("#f5394f3f", "#dfe2e5", None, "#f5394f"),
            },
        },
        "sourceVersion": "Astryx core 0.6.4; d2daa25689f6e7552df17b10194eec4ad34f7575",
        "sources": [
            "Banner/Banner.tsx:218-223,243-256,285-305,358-370",
            "theme/tokens.stylex.ts:59-67; docsite themes/astryxTheme.ts:38-44,72-75,93-105",
        ],
        "adaptations": [
            "The single authored content slot maps the source title-only 600-weight Banner; optional descriptions, adaptive actions and collapsible supplementary content are not synthesized.",
            "Local danger maps source error, while source informational neutral overlay and status alpha fills remain uncomposited.",
            "Source rem typography/icon dimensions remain scalable; source fixed-pixel padding and rounded plate geometry remain fixed.",
        ],
    },
    "shadcn-inspired": {
        "presentation": "outlined",
        "geometry": {
            "paddingBlock": dimension(0.75, "rem"), "paddingInline": dimension(1, "rem"),
            "gap": dimension(0.625, "rem"), "radius": dimension(1.125, "rem"),
            "borderWidth": dimension(1), "fontSize": dimension(0.875, "rem"),
            "lineHeight": number(10 / 7), "weight": weight(400),
            "iconSize": dimension(1, "rem"), "iconBlockOffset": dimension(0.125, "rem"),
        },
        "paints": {
            "light": {
                "info": ("#ffffff", "#0a0a0a", "#e5e5e5", "#0a0a0a"),
                "success": ("#ffffff", "#0a0a0a", "#e5e5e5", "#0a0a0a"),
                "warning": ("#ffffff", "#0a0a0a", "#e5e5e5", "#0a0a0a"),
                "danger": ("#ffffff", "#e7000b", "#e5e5e5", "#e7000b"),
            },
            "dark": {
                "info": ("#171717", "#fafafa", ("#ffffff", 0.1), "#fafafa"),
                "success": ("#171717", "#fafafa", ("#ffffff", 0.1), "#fafafa"),
                "warning": ("#171717", "#fafafa", ("#ffffff", 0.1), "#fafafa"),
                "danger": ("#171717", "#ff6467", ("#ffffff", 0.1), "#ff6467"),
            },
        },
        "sourceVersion": "shadcn Rhea/Neutral a87a63b2ca25143d26c8bd0903e4e9bc77b3f824",
        "sources": [
            "apps/v4/registry/styles/style-rhea.css:509-530",
            "apps/v4/app/legacy-themes.css:498-548; apps/v4/app/globals.css:54",
        ],
        "sourceColorCoordinates": {
            "light": {"background": "oklch(1 0 0)", "color": "oklch(.145 0 0)", "border": "oklch(.922 0 0)", "danger": "oklch(.577 .245 27.325)"},
            "dark": {"background": "oklch(.205 0 0)", "color": "oklch(.985 0 0)", "border": "oklch(1 0 0 / 10%)", "danger": "oklch(.704 .191 22.216)"},
        },
        "adaptations": [
            "Source Alert exposes default/destructive only; local info/success/warning share neutral default paint and danger maps destructive.",
            "The single authored content slot retains 400 weight; source title 500 and muted description/destructive-description 90% opacity require authored composition.",
            "The token engine accepts sRGB only: source OKLCH values use rounded sRGB equivalents, including destructive Red600 #e7000b and Red400 #ff6467. Exact source coordinates remain recorded here.",
            "Dark border alpha remains exactly 0.1 rather than the rounded hexadecimal approximation 26/255.",
            "No source size or disabled-state vocabulary is invented; optional authored icons and protected local dismissal remain local contracts.",
        ],
    },
    "radix-inspired": {
        "presentation": "plate",
        # The existing Radix baseline already supplies default size-2 padding
        # 16px, gap 12px, radius 8px and body 14/20. Avoid redundant geometry.
        "geometry": {"iconLineHeight": dimension(1.25, "rem")},
        "paints": {
            "light": {
                "info": ("#0047f112", "#002bb7c5", None, "#002bb7c5"),
                "success": ("#00a43319", "#00713fde", None, "#00713fde"),
                "warning": ("#ffde003d", "#ab6400", None, "#ab6400"),
                "danger": ("#f3000d14", "#c40006d3", None, "#c40006d3"),
            },
            "dark": {
                "info": ("#2f62ff3c", "#9eb1ff", None, "#9eb1ff"),
                "success": ("#22ff991e", "#46fea5d4", None, "#46fea5d4"),
                "warning": ("#fa820022", "#ffca16", None, "#ffca16"),
                "danger": ("#ff173f2d", "#ff9592", None, "#ff9592"),
            },
        },
        "sourceVersion": "@radix-ui/themes 3.3.0",
        "sources": [
            "src/components/callout.css; src/components/callout.props.tsx",
            "tokens/colors/{indigo,green,amber,red}.css (sRGB A3 and A11 branches)",
        ],
        "adaptations": [
            "Default soft size-2 Callout is mapped; the local info/success/warning/danger vocabulary selects indigo/green/amber/red source palettes.",
            "Source sRGB alpha colors remain translucent; Display-P3 enhancement, highContrast and surface/outline variants are not added.",
            "The optional authored glyph remains application-owned; its wrapper aligns within the source 20px first-line height.",
        ],
    },
    "web-awesome-inspired": {
        "presentation": "callout",
        "geometry": {
            "paddingEm": number(1), "gap": dimension(0),
            "radius": dimension(0.75, "rem"), "borderWidth": dimension(0.0625, "rem"),
            "lineHeight": number(1.6), "weight": weight(400),
            "iconFontScale": number(1.25), "iconMarginEndEm": number(1),
        },
        "paints": {
            "light": {
                "info": ("#e8f3ff", "#1b1d26", "#d1e8ff", "#0053c0"),
                "success": ("#e3f9e3", "#1b1d26", "#c2f2c1", "#036730"),
                "warning": ("#fef3cd", "#1b1d26", "#ffe495", "#8c4602"),
                "danger": ("#fff0ef", "#1b1d26", "#ffdedc", "#b30532"),
            },
            "dark": {
                "info": ("#001a4e", "#f1f2f3", "#002d77", "#3e96ff"),
                "success": ("#052310", "#f1f2f3", "#0a3a1d", "#00ac49"),
                "warning": ("#331600", "#f1f2f3", "#532600", "#da7e00"),
                "danger": ("#3e0913", "#f1f2f3", "#631323", "#f3676c"),
            },
        },
        "sourceVersion": "@awesome.me/webawesome 3.13.0",
        "sources": [
            "dist-cdn/chunks/chunk.UIKY7WPI.js:8-18,51-66 (callout.styles.ts)",
            "dist-cdn/styles/themes/default.css:39-75,123-159; variant palettes; native.css:25-34",
        ],
        "adaptations": [
            "Body fontSize remains omitted to preserve local explicit/inherited 16/16/18px sizing; the small UI-text recipe retains its base-size floor. Upstream size selection uses 14/16/20px.",
            "Panel corner and stroke retain the source .75rem and .0625rem units at its default scale, so root text growth enlarges the boundary as well as the body.",
            "Source one-em spacing is applied to the 1.25em icon wrapper; an authored glyph with its own font metrics can differ from upstream slotted-glyph margin resolution.",
            "Local info maps source brand; source default callout appearance and authored icon/content are preserved without adding source appearance vocabulary.",
            "Local announcement and optional dismiss semantics remain unchanged; the upstream Callout does not own these behaviors.",
        ],
    },
}


def update(definition: dict) -> None:
    """Replace only the included theme's owned source-alert rule and tokens."""
    theme_id = definition.get("id")
    if theme_id not in PROFILES:
        raise ValueError("Expected one of the six reviewed inspired themes.")
    profile = PROFILES[theme_id]
    roles = None
    for mode in ("light", "dark"):
        tokens = copy.deepcopy(profile["geometry"])
        for variant, paints in profile["paints"][mode].items():
            for suffix, value in zip(("Background", "Color", "BorderColor", "IconColor"), paints):
                if value is not None:
                    tokens[variant + suffix] = color(value)
        source = definition["baseOptions"][mode].setdefault("source", {})
        source.setdefault("theme", {})["source-alert"] = {token_name(name): value for name, value in tokens.items()}
        mode_roles = {name: "theme.source-alert." + token_name(name) for name in tokens}
        if roles is not None and mode_roles != roles:
            raise ValueError("Source-alert role names must match across appearances.")
        roles = mode_roles

    rules = definition["companion"]["rules"]
    rules[:] = [rule for rule in rules if rule.get("target") != "source-alert"]
    rules.append({
        "target": "source-alert", "presentation": profile["presentation"],
        "tokens": {}, "roles": roles,
    })
    definition["reference"]["sourceAlertReview"] = {
        "date": "2026-10-03", "sourceVersion": profile["sourceVersion"],
        "sources": copy.deepcopy(profile["sources"]),
        "changes": [
            "Default source alert/callout anatomy mapped through existing public base/content/icon/close Parts and native helpers.",
            "Independent body, icon, background and border paint per local semantic variant.",
        ],
        "adaptations": copy.deepcopy(profile["adaptations"]) + [
            "Authored content/icons, local announcement/dismissal semantics, protected targets and explicit CSS customization remain authoritative.",
            "Forced-color system paint remains authoritative; no animation, behavioral API or implicit icon dependency is introduced.",
        ],
        "verification": "pending coordinated compiler, browser, native/custom, nested-theme and forced-color checks",
    }
    if "sourceColorCoordinates" in profile:
        definition["reference"]["sourceAlertReview"]["sourceColorCoordinates"] = copy.deepcopy(profile["sourceColorCoordinates"])


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[2])
    parser.add_argument("--id", choices=tuple(PROFILES), help="Preview only one included theme.")
    args = parser.parse_args()
    definitions = json.loads((args.root / "tooling/theme-candidates/definitions.json").read_text())
    selected = [item for item in definitions if item.get("id") in PROFILES and (args.id is None or item["id"] == args.id)]
    previews = []
    for original in selected:
        definition = copy.deepcopy(original)
        update(definition)
        previews.append({"id": definition["id"], "changed": definition != original, "definition": definition})
    print(json.dumps(previews, indent=2))


if __name__ == "__main__":
    main()
