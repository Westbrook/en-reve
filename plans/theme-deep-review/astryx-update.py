#!/usr/bin/env python3
"""Preview (default) or apply reviewed Astryx-only recipe corrections.

Run from any directory:
  python3 plans/theme-deep-review/astryx-update.py
  python3 plans/theme-deep-review/astryx-update.py --apply

This script intentionally does not build, regenerate evidence or run tests.
It leaves all other definitions and recipes unchanged.
"""

from __future__ import annotations

import argparse
import copy
import json
import re
from pathlib import Path

REVISION = "d2daa25689f6e7552df17b10194eec4ad34f7575"
SOURCE_ROOT = f"https://github.com/facebook/astryx/blob/{REVISION}/"
# The existing surface-motion consumer clamps at 500 ms; source is 550 ms.
SUPPORTED_DIALOG_ENTER_MS = 500


def color(hex_value: str) -> dict:
    return {
        "colorSpace": "srgb",
        "components": [int(hex_value[i : i + 2], 16) / 255 for i in (0, 2, 4)],
    }


def composite(foreground: str, alpha: float, background: str) -> dict:
    fg = color(foreground)["components"]
    bg = color(background)["components"]
    return {
        "colorSpace": "srgb",
        "components": [a * alpha + b * (1 - alpha) for a, b in zip(fg, bg)],
    }


def luminance(value: dict) -> float:
    channels = [v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4
                for v in value["components"]]
    return sum(v * weight for v, weight in zip(channels, (0.2126, 0.7152, 0.0722)))


def alpha_color(hex_value: str, alpha: float) -> dict:
    return {**color(hex_value), "alpha": alpha}


def over(foreground: dict, background: dict) -> dict:
    fa, ba = foreground.get("alpha", 1), background.get("alpha", 1)
    alpha = fa + ba * (1 - fa)
    return {"colorSpace": "srgb", "components": [
        (f * fa + b * ba * (1 - fa)) / alpha
        for f, b in zip(foreground["components"], background["components"])
    ], "alpha": alpha}


def mix(background: dict, foreground: dict, weight: float) -> dict:
    # color-mix(in srgb) interpolates premultiplied-alpha channels.
    ba, fa = background.get("alpha", 1) * (1 - weight), foreground.get("alpha", 1) * weight
    alpha = ba + fa
    return {"colorSpace": "srgb", "components": [
        (b * ba + f * fa) / alpha
        for b, f in zip(background["components"], foreground["components"])
    ], "alpha": alpha}


def dimension(value: float) -> dict:
    return {"value": value, "unit": "px"}


def token_segment(name: str) -> str:
    # Companion role keys are camelCase; source token segments are kebab-case.
    return re.sub(r"([a-z0-9])([A-Z])", r"\1-\2", name).lower()


def anatomy(definition: dict, mode: str) -> list[dict]:
    source = definition["baseOptions"][mode]["source"]
    values = source.setdefault("theme", {}).setdefault("astryx", {})
    rules = []

    def add(target: str, presentation: str, group: str, roles: dict) -> None:
        source_group = token_segment(group)
        if source_group != group:
            values.pop(group, None)
        values[source_group] = {token_segment(name): {"$type": kind, "$value": value}
                                for name, (kind, value) in roles.items()}
        rules.append({"target": target, "presentation": presentation, "tokens": {},
                      "roles": {name: f"theme.astryx.{source_group}.{token_segment(name)}" for name in roles}})

    def length(value: float) -> tuple:
        return "dimension", dimension(value)

    primary = color("15110C" if mode == "light" else "DFE2E5")
    surface = color("FFFFFF" if mode == "light" else "1F1F22")
    off = alpha_color("0A1317", 0.2) if mode == "light" else alpha_color("666A72", 76 / 255)
    tint = color("000000" if mode == "light" else "FFFFFF")
    overlay_hex = "053659" if mode == "light" else "FFFFFF"
    hover_overlay, press_overlay = alpha_color(overlay_hex, 12 / 255), alpha_color(overlay_hex, 25 / 255)
    hover_off, hover_on = mix(off, tint, 0.05), mix(primary, tint, 0.15)
    switch = {
        "borderWidth": length(0),
        "borderColor": ("color", alpha_color("000000", 0)),
        "checkedBorderColor": ("color", alpha_color("000000", 0)),
        "background": ("color", off), "checkedBackground": ("color", primary),
        "thumbBackground": ("color", surface), "checkedThumbBackground": ("color", surface),
        "thumbShadow": ("shadow", "{shadow.none}"), "checkedThumbShadow": ("shadow", "{shadow.none}"),
        "hoverBackground": ("color", hover_off), "hoverCheckedBackground": ("color", hover_on),
        "pressedBackground": ("color", over(press_overlay, off)),
        "pressedCheckedBackground": ("color", over(press_overlay, primary)),
        "pressedThumbBackground": ("color", over(press_overlay, surface)),
        "pressedCheckedThumbBackground": ("color", over(press_overlay, surface)),
        "hoverPressedBackground": ("color", over(press_overlay, hover_off)),
        "hoverPressedCheckedBackground": ("color", over(press_overlay, hover_on)),
        "disabledOpacity": ("number", 0.5),
        "duration": ("duration", {"value": 175, "unit": "ms"}),
        "ease": ("cubicBezier", [0.24, 1, 0.4, 1]),
    }
    # Astryx offers sm/md only. En Rêve large deliberately reuses source md.
    for suffix, (inline, block, thumb, checked, inset, checked_inset) in {
        "Small": (32, 20, 14, 16, 2, 2),
        "Medium": (40, 24, 16, 20, 4, 2),
        "Large": (40, 24, 16, 20, 4, 2),
    }.items():
        for name, value in zip(("inlineSize", "blockSize", "thumbSize", "checkedThumbSize", "inset", "checkedInset"),
                               (inline, block, thumb, checked, inset, checked_inset)):
            switch[name + suffix] = length(value)
    add("stateful-switch", "stateful", "switch", switch)
    add("sized-choice", "source-size", "choice", {
        "sizeSmall": length(20), "sizeMedium": length(24), "sizeLarge": length(24),
    })
    add("overlay-checkbox", "overlay", "checkbox", {
        "background": ("color", surface), "borderColor": ("color", "{color.boundary}"),
        "checkedBackground": ("color", primary), "hoverBackground": ("color", mix(surface, tint, 0.05)),
        # Preserve the stronger baseline boundary, applying the source20% tint
        # to that boundary rather than weakening it to the source's pale line.
        "hoverBorderTint": ("color", tint),
        "hoverCheckedBackground": ("color", hover_on), "pressedOverlay": ("color", press_overlay),
        "duration": ("duration", {"value": 175, "unit": "ms"}), "ease": ("cubicBezier", [0.24, 1, 0.4, 1]),
    })
    add("inset-tab", "line", "tab", {
        "weight": ("fontWeight", 400), "selectedWeight": ("fontWeight", 600),
        "indicatorSize": length(2), "indicatorInset": length(12), "indicatorColor": ("color", primary),
    })
    add("form-field", "compact", "fieldText", {
        "helper-size": length(12), "helper-line-height": ("number", 20 / 12), "helper-weight": ("fontWeight", 400),
        "error-size": length(12), "error-line-height": ("number", 20 / 12), "error-weight": ("fontWeight", 400),
    })
    inset_shape = {"offsetX": dimension(0), "offsetY": dimension(0), "blur": dimension(0), "spread": dimension(2), "inset": True}
    add("inset-field", "inset", "fieldInset", {
        "hoverShadow": ("shadow", [{**inset_shape, "color": alpha_color("CCD3DB" if mode == "light" else "494D53", 0.3)}]),
        "focusShadow": ("shadow", [{**inset_shape, "color": {**primary, "alpha": 0.08 if mode == "light" else 0.14}}]),
    })
    add("raised-segments", "raised", "segments", {
        "frameInset": length(2), "radius": length(12), "gap": length(2),
        "background": ("color", copy.deepcopy(source["component"]["editor-token"]["background"]["$value"])),
        "color": ("color", "{color.text-muted}"),
        "hoverBackground": ("color", hover_overlay), "pressedBackground": ("color", press_overlay),
        "selectedBackground": ("color", surface), "selectedColor": ("color", "{color.text}"),
        "selectedHoverBackground": ("color", over(hover_overlay, surface)),
        "selectedPressedBackground": ("color", over(press_overlay, surface)),
        "selectedShadow": ("shadow", "{shadow.overlay}"),
        "weight": ("fontWeight", 400), "selectedWeight": ("fontWeight", 600),
    })
    add("tooltip", "compact", "tooltip", {
        "fontSize": length(14), "lineHeight": ("number", 20 / 14), "fontWeight": ("fontWeight", 400),
        "background": ("color", primary), "color": ("color", surface),
        "borderColor": ("color", alpha_color("000000", 0)), "borderWidth": length(0),
        "shadow": ("shadow", "{shadow.none}"), "maxInlineSize": length(316),
        "paddingInline": length(8), "paddingBlock": length(4), "radius": length(16),
    })
    add("dialog-surface", "plain", "dialog", {
        "fontSize": length(14), "lineHeight": ("number", 20 / 14), "fontWeight": ("fontWeight", 400),
        "background": ("color", surface), "color": ("color", primary),
        "borderColor": ("color", alpha_color("000000", 0)), "borderWidth": length(0),
        "backdropBlur": length(2),
    })
    add("token-text", "supporting", "tokenText", {
        "fontSize": length(12), "lineHeight": ("number", 20 / 12), "weight": ("fontWeight", 500),
    })
    return rules


def update(definition: dict) -> list[str]:
    changes = []
    anatomy_rules = None
    for mode in ("light", "dark"):
        baseline = definition["baseOptions"][mode]
        source, pins = baseline["source"], baseline["pins"]
        source["font"]["metadata"]["line-height"]["$value"] = 20 / 12
        pins.pop("component.editor-token.pressed-background", None)
        # The typed size profile supplies source sm/md geometry; leaving this
        # old fixed hook would flatten it because explicit public hooks win.
        pins.pop("component.choice.size", None)
        pins["component.toast.enter-duration"] = {"value": 175, "unit": "ms"}
        pins["component.dialog.enter-duration"] = {
            "value": SUPPORTED_DIALOG_ENTER_MS, "unit": "ms"
        }
        pins["component.segmented-control.frame-inset"] = {"value": 2, "unit": "px"}
        # Source changes depth on hover, retaining the same perimeter. Keep
        # the existing stronger boundary as an accessibility adaptation.
        pins["component.input.hover-border-color"] = "{color.boundary}"

        # Restore source anatomy. Dark deepens the fill to keep inverse text
        # above 4.5:1 through source white hover/pressed overlays.
        fill = "E3193B" if mode == "light" else "D31130"
        overlay = "053659" if mode == "light" else "FFFFFF"
        danger = source["theme"]["button"]["danger"]
        backgrounds = {
            "rest": color(fill),
            "hover": composite(overlay, 12 / 255, fill),
            "pressed": composite(overlay, 25 / 255, fill),
        }
        for state, background in backgrounds.items():
            danger[f"{state}-background"]["$value"] = background
            danger[f"{state}-color"]["$value"] = color("FFFFFF")
            contrast = 1.05 / (luminance(background) + 0.05)
            if contrast < 4.5:
                raise ValueError(f"{mode}/{state} white contrast {contrast:.3f} is below 4.5")
            changes.append(f"{mode} danger {state}: inverse text contrast {contrast:.3f}:1")
        danger["border-color"]["$value"] = {**color("000000"), "alpha": 0}
        changes.append(
            f"{mode}: metadata12/20; token composed press restored; toast enter175ms; "
            f"dialog enter{SUPPORTED_DIALOG_ENTER_MS}ms (source550ms); segmented inset2px"
        )
        current_rules = anatomy(definition, mode)
        if anatomy_rules is not None and current_rules != anatomy_rules:
            raise ValueError("Light and dark anatomy must have the same role mapping")
        anatomy_rules = current_rules

    assert anatomy_rules is not None
    own_targets = {rule["target"] for rule in anatomy_rules}
    definition["companion"]["rules"] = [rule for rule in definition["companion"]["rules"]
        if rule["target"] not in own_targets] + anatomy_rules

    definition["reference"]["deepReview"] = {
        "dateUTC": "2026-10-03",
        "sourceCommit": REVISION,
        "coreSourceVersion": "0.6.4",
        "report": "plans/theme-deep-review/astryx.md",
        "manifest": "plans/theme-deep-review/astryx-sources.json",
        "sources": {
            "tokens": SOURCE_ROOT + "packages/core/src/theme/tokens.stylex.ts",
            "button": SOURCE_ROOT + "packages/core/src/Button/Button.tsx",
            "token": SOURCE_ROOT + "packages/core/src/Token/Token.tsx",
            "toast": SOURCE_ROOT + "packages/core/src/Toast/Toast.tsx",
            "dialog": SOURCE_ROOT + "packages/core/src/Dialog/Dialog.tsx",
            "segmented": SOURCE_ROOT + "packages/core/src/SegmentedControl/SegmentedControl.tsx",
        },
        "adaptations": [
            "Dark destructive fill #D31130 preserves inverse ordinary-text contrast through source overlays.",
            f"Dialog source enter550ms is mapped to the existing consumer's {SUPPORTED_DIALOG_ENTER_MS}ms supported bound; source16px travel remains bounded to8px.",
            "Theme changes do not replace host focus, reduced-motion, forced-color, target-floor or dismissal contracts.",
            "Astryx exposes only small and medium choice/switch profiles; En Rêve large reuses medium rather than inventing upstream geometry.",
            "Input state inset paint is applied to enabled valid controls; owned invalid and disabled presentation is retained.",
            "Checkbox20% hover border tint is applied to the existing stronger functional boundary; source surface tint and whole-indicator pressed overlay are preserved.",
            "Top-navigation selection remains the general navigation mapping because the theme cannot infer an application's header versus side-navigation intent.",
        ],
    }
    return changes


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true", help="Write the Astryx-only change")
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[2]
    path = root / "tooling/theme-candidates/definitions.json"
    original = json.loads(path.read_text())
    definitions = copy.deepcopy(original)
    matches = [item for item in definitions if item["id"] == "astryx-inspired"]
    if len(matches) != 1:
        raise ValueError("Expected exactly one Astryx definition")
    changes = update(matches[0])
    for before, after in zip(original, definitions):
        if before["id"] != "astryx-inspired" and before != after:
            raise ValueError(f"Unexpected change outside Astryx: {before['id']}")
    for change in changes:
        print(change)
    if args.apply:
        path.write_text(json.dumps(definitions, indent=2, ensure_ascii=False) + "\n")
        print(f"Updated {path}")
    else:
        print("Preview only: no recipe files written. Use --apply after review.")


if __name__ == "__main__":
    main()
