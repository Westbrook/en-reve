#!/usr/bin/env python3
"""Prepare the pinned Web Awesome 3.13 default dialog and tooltip mappings.

Import update(definition) for coordinated serial application. CLI execution only
prints a preview; it does not write definitions, generate assets, or run checks.
"""
from __future__ import annotations
import argparse
import copy
import json
from pathlib import Path


def dimension(value: float, unit: str = "rem") -> dict:
    return {"$type": "dimension", "$value": {"value": value, "unit": unit}}


def number(value: float) -> dict:
    return {"$type": "number", "$value": value}


def color(value: str) -> dict:
    return {"$type": "color", "$value": {"colorSpace": "srgb", "components": [int(value[i:i + 2], 16) / 255 for i in (1, 3, 5)], "alpha": 1}}


def update(definition: dict) -> None:
    if definition.get("id") != "web-awesome-inspired" or definition.get("reference", {}).get("version") != "3.13.0":
        raise ValueError("Expected the pinned Web Awesome 3.13.0 definition.")
    for mode in ("light", "dark"):
        theme = definition["baseOptions"][mode].setdefault("source", {}).setdefault("theme", {})
        theme["web-awesome-overlay"] = {
            "dialog-width": dimension(31), "viewport-gutter": dimension(2.5),
            "section-padding": dimension(1.5), "zero": dimension(0),
            "header-control-padding-em": number(.75), "footer-gap": dimension(.5),
            "title-size": dimension(1), "title-size-multiplier": number(1.265625), "title-line": number(1.2),
            "title-weight": {"$type": "fontWeight", "$value": 600},
            "tooltip-font-size": dimension(1), "tooltip-font-divisor": number(1.125), "tooltip-line": number(1.6),
            "tooltip-radius": dimension(.1875), "tooltip-border-width": dimension(.0625),
            "tooltip-inline-em": number(.5), "tooltip-block-em": number(.25),
            "tooltip-characters": number(30),
            "tooltip-background": color("#1b1d26" if mode == "light" else "#f1f2f3"),
            "tooltip-color": color("#ffffff" if mode == "light" else "#101219"),
        }
    prefix = "theme.web-awesome-overlay."
    dialog = {"target": "dialog", "presentation": "sectioned", "tokens": {}, "roles": {
        "inlineSize": prefix + "dialog-width", "viewportGutter": prefix + "viewport-gutter",
        "borderWidth": prefix + "zero", "sectionInlinePadding": prefix + "section-padding",
        "headerBlockStartPadding": prefix + "section-padding", "headerBlockEndPadding": prefix + "zero",
        "headerControlPaddingEm": prefix + "header-control-padding-em", "headerGap": prefix + "section-padding",
        "bodyBlockStartPadding": prefix + "section-padding", "bodyBlockEndPadding": prefix + "section-padding",
        "footerBlockStartPadding": prefix + "zero", "footerBlockEndPadding": prefix + "section-padding",
        "footerGap": prefix + "footer-gap", "titleFontSize": prefix + "title-size",
        "titleFontSizeMultiplier": prefix + "title-size-multiplier",
        "titleLineHeight": prefix + "title-line", "titleFontWeight": prefix + "title-weight",
        "fontSize": "font.body.size", "lineHeight": "font.body.line-height", "fontWeight": "font.body.weight",
    }}
    tooltip = {"target": "tooltip", "presentation": "compact", "tokens": {}, "roles": {
        "background": prefix + "tooltip-background", "color": prefix + "tooltip-color",
        "borderColor": prefix + "tooltip-background", "borderWidth": prefix + "tooltip-border-width",
        "shadow": "shadow.none", "radius": prefix + "tooltip-radius",
        "fontSize": prefix + "tooltip-font-size", "fontSizeDivisor": prefix + "tooltip-font-divisor", "lineHeight": prefix + "tooltip-line", "fontWeight": "font.body.weight",
        "paddingInlineEm": prefix + "tooltip-inline-em", "paddingBlockEm": prefix + "tooltip-block-em",
        "maxInlineCharacters": prefix + "tooltip-characters",
    }}
    rules = definition["companion"]["rules"]
    rules[:] = [rule for rule in rules if rule.get("target") not in ("dialog", "tooltip")] + [dialog, tooltip]
    definition["reference"]["overlayReview"] = {
        "date": "2026-10-03", "sourceVersion": "3.13.0",
        "report": "plans/theme-deep-review/web-awesome-overlays.md",
        "changes": [
            "fixed 31rem centered dialog width, 2.5rem viewport clearance, borderless zero-padding surface",
            "source body/footer insets, optional footer collapse, and em-based header close compensation",
            "inverse tooltip plate, compact typography, em padding, rem corners/border, no shadow and 30ch cap",
            "public override fallbacks and one native arrow-content padding owner",
        ],
        "adaptations": [
            "Dialog header wrapping and protected close targets remain En Reve behavior; the source has a separate header-actions slot and a nowrap header.",
            "The source tooltip enables its arrow by default; En Reve preserves its authored arrow API and local placement, collision, focus, dismissal and trigger timing contracts.",
            "The source dialog's width-at-most-420px 80vh maximum is not copied: the existing local dynamic-viewport maximum and responsive drawer contract remain authoritative.",
            "Source heading/body slot ownership, no-header and additional header-actions APIs are not introduced by theme data. En Reve description and dismissible contracts remain unchanged.",
            "Popup/dialog motion and source pulse-on-denied-dismissal are not changed by this geometry mapping; existing reduced-motion behavior remains authoritative.",
            "Native helper consumers retain ownership of dialog/popover activation and authored markup. Theme presentation does not add controllers.",
        ],
        "verification": "Qualification evidence is recorded in plans/theme-deep-review/verification-20261003.json; source mapping and limits are recorded in plans/theme-deep-review/web-awesome-overlays.md.",
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[2])
    args = parser.parse_args()
    definitions = json.loads((args.root / "tooling/theme-candidates/definitions.json").read_text())
    matches = [item for item in definitions if item.get("id") == "web-awesome-inspired"]
    if len(matches) != 1:
        raise SystemExit("Expected exactly one Web Awesome definition.")
    proposed = copy.deepcopy(matches[0]); update(proposed)
    print(json.dumps({"changed": proposed != matches[0], "definition": proposed}, indent=2))


if __name__ == "__main__":
    main()
