#!/usr/bin/env python3
"""Prepare the Web Awesome 3.13.0 default outlined Details presentation.

The coordinator imports update(definition) and applies all definition changes
serially. Direct execution is a read-only preview: no writes, builds or tests.
Source: installed dist/chunks/chunk.W62SLQ7P.js and styles/themes/default.css.
"""
from __future__ import annotations

import argparse
import copy
import json
from pathlib import Path


def dimension(value: float, unit: str = "rem") -> dict:
    return {"$type": "dimension", "$value": {"value": value, "unit": unit}}


def update(definition: dict) -> None:
    """Idempotently select the source default without changing other families."""
    if definition.get("id") != "web-awesome-inspired" or definition.get("reference", {}).get("version") != "3.13.0":
        raise ValueError("Expected the canonical Web Awesome 3.13.0 definition.")

    for mode in ("light", "dark"):
        source = definition["baseOptions"][mode].setdefault("source", {})
        source.setdefault("theme", {}).setdefault("web-awesome-details", {}).update({
            # Default panel border/radius and --spacing. These are source rem
            # values, not an em-scaled Details size API (the source has none).
            "border-width": dimension(0.0625),
            "radius": dimension(0.75),
            "padding": dimension(1),
            "disabled-opacity": {"$type": "number", "$value": 0.5},
            "indicator-inline": dimension(1.25),
            "indicator-block": dimension(1),
            # Local border chevron preserves direction/state in the source's
            # default canvas; it does not duplicate the Font Awesome SVG asset.
            "indicator-mark": dimension(0.375),
            "indicator-stroke": dimension(0.125),
            "indicator-duration": {"$type": "duration", "$value": {"value": 150, "unit": "ms"}},
            "indicator-ease": {"$type": "cubicBezier", "$value": [0.25, 0.1, 0.25, 1]},
        })

    prefix = "theme.web-awesome-details."
    rule = {
        "target": "source-details",
        "presentation": "outlined",
        "tokens": {},
        "roles": {
            "borderWidth": prefix + "border-width",
            "radius": prefix + "radius",
            "padding": prefix + "padding",
            "gap": prefix + "padding",
            "fontSize": "font.body.size",
            "lineHeight": "font.body.line-height",
            "weight": "font.body.weight",
            "background": "color.surface",
            "borderColor": "color.line",
            "color": "color.text",
            "indicatorColor": "color.text-muted",
            "disabledOpacity": prefix + "disabled-opacity",
            "indicatorInlineSize": prefix + "indicator-inline",
            "indicatorBlockSize": prefix + "indicator-block",
            "indicatorMarkSize": prefix + "indicator-mark",
            "indicatorStroke": prefix + "indicator-stroke",
            "indicatorDuration": prefix + "indicator-duration",
            "indicatorEase": prefix + "indicator-ease",
        },
    }
    rules = definition["companion"]["rules"]
    rules[:] = [current for current in rules if current["target"] != "source-details"] + [rule]
    definition["reference"]["detailsReview"] = {
        "date": "2026-10-03",
        "report": "plans/theme-deep-review/shared-and-additional.md",
        "sourceVersion": "3.13.0",
        "profile": "Default theme and palette; outlined appearance; end indicator",
        "changes": [
            "individual full-border enclosures, source header typography and all-side content insets",
            "custom accordion, native accordion and semantic details/summary delivery",
            "unchanged source hover/held paint and one whole-item disabled fade",
        ],
        "adaptations": [
            "Immediate disclosure, synchronous cancellation, keyboard ownership, protected targets and local focus remain En Reve contracts; the source body height/opacity animation is not reproduced.",
            "A local border chevron preserves the source closed inline-end/open-down direction in a 20 by 16px default canvas; the Font Awesome SVG glyph is not copied.",
            "The selected source profile has no size API; body typography and rem enclosure metrics are retained across local host size choices.",
            "The semantic native recipe uses open-only ::details-content padding where supported. Its root-padding fallback preserves arbitrary content and plain-text geometry but does not promise source-equivalent authored block-margin collapse.",
            "Native details has no disabled control state: aria-disabled paint requires consumer-owned interaction prevention. Native accordion buttons and custom accordion retain their existing disabled semantics.",
            "Filled, filled-outlined, plain and start-indicator alternatives are outside this selected default profile.",
        ],
        "verification": "prepared; coordinator application and rendered verification pending",
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[2])
    args = parser.parse_args()
    definitions = json.loads((args.root / "tooling/theme-candidates/definitions.json").read_text())
    matches = [entry for entry in definitions if entry.get("id") == "web-awesome-inspired"]
    if len(matches) != 1:
        raise SystemExit("Expected exactly one Web Awesome definition.")
    preview = copy.deepcopy(matches[0])
    update(preview)
    print(json.dumps({"changed": preview != matches[0], "definition": preview}, indent=2))


if __name__ == "__main__":
    main()
