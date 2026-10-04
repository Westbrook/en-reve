#!/usr/bin/env python3
"""Prepare the pinned Web Awesome 3.13.0 rating companion mapping.

Import update(definition) for the coordinator's serial definition update. Running
this file prints a read-only preview; it never writes definitions or runs checks.
"""
from __future__ import annotations

import argparse
import copy
import json
from pathlib import Path


def typed(kind: str, value: object) -> dict:
    return {"$type": kind, "$value": value}


def dimension(value: float) -> dict:
    return typed("dimension", {"value": value, "unit": "px"})


def color(red: int, green: int, blue: int, alpha: float = 1) -> dict:
    return typed("color", {
        "colorSpace": "srgb",
        "components": [red / 255, green / 255, blue / 255],
        "alpha": alpha,
    })


SOURCE_PREFIX = "theme.web-awesome-rating."
SIZE_METRICS = {
    # Source s/m/l at root 16px and font scale 1. Each tuple contains glyph font
    # size, 1.25em icon canvas width, icon canvas height, .125em gap/padding,
    # and source icon-plus-padding target width. En Reve keeps square targets
    # with its independent 24px pointer and 44px coarse-pointer minimums.
    "Small": (14, 17.5, 14, 1.75, 21),
    "Medium": (16, 20, 16, 2, 24),
    "Large": (20, 25, 20, 2.5, 30),
}


def source_values(mode: str) -> dict:
    values = {
        "filled-color": color(239, 157, 0),
        "disabled-filled-color": color(239, 157, 0),
        "empty-color": color(84, 88, 104) if mode == "light" else color(145, 148, 162),
        "disabled-opacity": typed("number", 0.5),
        "pressed-background": color(0, 0, 0, 0),
        "pressed-scale": typed("number", 1),
        "pressed-offset": dimension(0),
    }
    for size, (glyph, inline, block, spacing, target) in SIZE_METRICS.items():
        suffix = size.lower()
        values[f"glyph-size-{suffix}"] = dimension(glyph)
        values[f"glyph-inline-size-{suffix}"] = dimension(inline)
        values[f"glyph-block-size-{suffix}"] = dimension(block)
        values[f"gap-{suffix}"] = dimension(spacing)
        values[f"padding-{suffix}"] = dimension(spacing)
        values[f"target-size-{suffix}"] = dimension(target)
    return values


def update(definition: dict) -> None:
    """Idempotently replace only this theme's positive-star presentation."""
    if definition.get("id") != "web-awesome-inspired":
        raise ValueError("Expected the canonical web-awesome-inspired definition.")
    reference = definition["reference"]
    if reference.get("version") != "3.13.0":
        raise ValueError("Expected the pinned Web Awesome 3.13.0 source version.")

    for mode in ("light", "dark"):
        source = definition["baseOptions"][mode].setdefault("source", {})
        source.setdefault("theme", {}).setdefault("web-awesome-rating", {}).update(source_values(mode))

    roles = {name: SOURCE_PREFIX + name for name in (
        "filled-color", "disabled-filled-color", "empty-color", "disabled-opacity", "pressed-background",
        "pressed-scale", "pressed-offset",
    )}
    roles["pressed-shadow"] = "shadow.none"
    for size in SIZE_METRICS:
        suffix = size.lower()
        for stem, name in (
            ("glyphSize", "glyph-size"),
            ("glyphInlineSize", "glyph-inline-size"),
            ("glyphBlockSize", "glyph-block-size"),
            ("gap", "gap"),
            ("padding", "padding"),
            ("targetSize", "target-size"),
        ):
            roles[stem + size] = SOURCE_PREFIX + name + "-" + suffix

    rules = definition["companion"]["rules"]
    rules[:] = [rule for rule in rules if rule["target"] != "rating"] + [{
        "target": "rating",
        "presentation": "compact",
        "tokens": {},
        "roles": roles,
    }]
    reference["ratingReview"] = {
        "date": "2026-10-03",
        "report": "plans/theme-deep-review/web-awesome-rating.md",
        "sourceVersion": "3.13.0",
        "changes": [
            "source s/m/l glyph, icon-canvas, padding and gap dimensions",
            "source gold filled stars and appearance-specific empty stars",
            "quiet positive-star held feedback and one disabled star-row fade",
        ],
        "adaptations": [
            "Source s/m/l em geometry maps to En Reve Small/Medium/Large at root 16px and font scale 1; arbitrary source font scaling is not claimed.",
            "Square positive-score targets retain En Reve's independent pointer and coarse-pointer floors, yielding 24/24/30px at ordinary size and at least 44px for coarse pointers.",
            "Unicode star glyphs remain; icon canvas dimensions do not claim the source Font Awesome SVG silhouette. Native integer radio selection and the separate No rating choice remain authoritative; source fractional and hover-preview behavior is not introduced.",
            "Disabled filled stars retain source gold through the additive semantic star-filled Part and native filled-state recipe; the star row receives the source 0.5 opacity once. Native focus and forced-color system paint remain authoritative.",
            "The source gold #ef9d00 has approximately 2.212:1 contrast on white; this source-color mapping does not establish accessibility equivalence with the upstream rating.",
        ],
        "verification": "pending coordinator application and rendered checks; source inspection only",
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[2])
    args = parser.parse_args()
    definitions = json.loads((args.root / "tooling/theme-candidates/definitions.json").read_text())
    matches = [item for item in definitions if item.get("id") == "web-awesome-inspired"]
    if len(matches) != 1:
        raise SystemExit("Expected exactly one canonical Web Awesome definition.")
    original = matches[0]
    preview = copy.deepcopy(original)
    update(preview)
    print(json.dumps({"changed": preview != original, "definition": preview}, indent=2))


if __name__ == "__main__":
    main()
