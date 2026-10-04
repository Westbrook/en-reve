#!/usr/bin/env python3
"""Prepare the Web Awesome 3.13.0 toast's logical leading accent rail.

The coordinator imports update(definition) and serially applies definition
changes. Direct execution previews only; it writes no files and runs no tests.
Source: installed chunk.6AMLOZPA.js, chunk.HANETBI3.js and Default palette/theme.
"""
from __future__ import annotations

import argparse
import copy
import json
from pathlib import Path


def color(value: str) -> dict:
    rgb = value.removeprefix("#")
    return {"$type": "color", "$value": {
        "colorSpace": "srgb", "components": [int(rgb[i:i + 2], 16) / 255 for i in (0, 2, 4)], "alpha": 1,
    }}


def update(definition: dict) -> None:
    """Add only the source-backed decorative toast presentation."""
    if definition.get("id") != "web-awesome-inspired" or definition.get("reference", {}).get("version") != "3.13.0":
        raise ValueError("Expected the canonical Web Awesome 3.13.0 definition.")
    for mode in ("light", "dark"):
        source = definition["baseOptions"][mode].setdefault("source", {})
        source.setdefault("theme", {}).setdefault("web-awesome-toast", {}).update({
            "accent-width": {"$type": "dimension", "$value": {"value": 4, "unit": "px"}},
            "icon-scale": {"$type": "number", "$value": 1.25},
            "gap": {"$type": "dimension", "$value": {"value": 1, "unit": "rem"}},
            # Default palette fill-loud uses scale50 in both appearances.
            # Local info deliberately translates to the source brand variant;
            # the source's omitted variant is neutral, absent from the host API.
            "info-accent": color("#0071ec"),
            "success-accent": color("#00883c"),
            "warning-accent": color("#b45f04"),
            "danger-accent": color("#dc3146"),
        })
    prefix = "theme.web-awesome-toast."
    rule = {"target": "toast", "presentation": "toast-accent-rail", "tokens": {}, "roles": {
        "accentWidth": prefix + "accent-width", "background": "color.surface-raised",
        "iconScale": prefix + "icon-scale", "gap": prefix + "gap",
        **{variant + "Accent": prefix + variant + "-accent" for variant in ("info", "success", "warning", "danger")},
    }}
    rules = definition["companion"]["rules"]
    rules[:] = [current for current in rules if not (
        current["target"] == "toast" and current.get("presentation") == "toast-accent-rail"
    )] + [rule]
    definition["reference"]["toastReview"] = {
        "date": "2026-10-03", "report": "plans/theme-deep-review/web-awesome-toast.md",
        "sourceVersion": "3.13.0", "profile": "Default theme/palette; medium; explicit host info maps to source brand",
        "changes": [
            "4px logical leading rail inside the existing rounded border for custom and native toast delivery",
            "independent source loud-fill status colors, with inherited status/general color-or-gradient paint hooks preserved",
            "rail-width space reserved alongside the existing icon column while preserving public padding shorthands and close inset",
            "source status glyph scale1.25 and1rem icon/content gap, with public icon size and inherited public typography retained",
        ],
        "adaptations": [
            "The source defaults to neutral without an icon; En Reve defaults to info with its existing semantic icon, translated to source brand.",
            "Local icon artwork and stronger semantic text-tone icon colors remain; the separate rail uses exact source loud-fill colors.",
            "The generated EnIcon keeps its independent foundation typography. Public typography overrides update both contexts; raw font-size set only on the parent does not replace that existing child foundation.",
            "Native markup that omits its immediate icon spans the first two tracks for a source-equivalent leading body inset; present-but-hidden authored icons retain their existing grid semantics.",
            "Existing announcements, persistent/actionable timing, transactional dismissal, queue, swipe and protected close targets remain host behavior; no source toast choreography is added.",
            "Forced colors retain the owning toast's system paint and original grid; the decorative source rail is suppressed.",
        ],
        "verification": "Qualification evidence is recorded in plans/theme-deep-review/verification-20261003.json; source mapping and limits are recorded in plans/theme-deep-review/web-awesome-toast.md.",
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[2])
    args = parser.parse_args()
    definitions = json.loads((args.root / "tooling/theme-candidates/definitions.json").read_text())
    matches = [entry for entry in definitions if entry.get("id") == "web-awesome-inspired"]
    if len(matches) != 1:
        raise SystemExit("Expected exactly one Web Awesome definition.")
    preview = copy.deepcopy(matches[0]); update(preview)
    print(json.dumps({"changed": preview != matches[0], "definition": preview}, indent=2))


if __name__ == "__main__":
    main()
