#!/usr/bin/env python3
"""Prepare the pinned Web Awesome 3.13.0 default-avatar presentation.

Import update(definition) for coordinated serial application. The command-line
entry point only prints a preview; it does not mutate definitions or run checks.
"""
from __future__ import annotations

import argparse
import copy
import json
from pathlib import Path


def color(hex_value: str) -> dict:
    return {"$type": "color", "$value": {
        "colorSpace": "srgb",
        "components": [int(hex_value[i:i + 2], 16) / 255 for i in (1, 3, 5)],
        "alpha": 1,
    }}


def update(definition: dict) -> None:
    """Replace only the default avatar mapping and its owned source values."""
    if definition.get("id") != "web-awesome-inspired" or definition["reference"].get("version") != "3.13.0":
        raise ValueError("Expected the pinned Web Awesome 3.13.0 definition.")

    for mode in ("light", "dark"):
        source = definition["baseOptions"][mode].setdefault("source", {})
        source.setdefault("theme", {})["web-awesome-avatar"] = {
            "background": color("#e4e5e9" if mode == "light" else "#2f323f"),
            "color": color("#424554" if mode == "light" else "#abaeb9"),
            # avatar.styles.ts sets font-size: calc(var(--size) * 0.4).
            "diameter-font-scale": {"$type": "number", "$value": 0.4},
            "font-weight": {"$type": "fontWeight", "$value": 400},
        }

    rule = {
        "target": "avatar", "presentation": "avatar-subtle", "tokens": {},
        "roles": {name: "theme.web-awesome-avatar." + name for name in (
            "background", "color", "diameter-font-scale", "font-weight",
        )},
    }
    rules = definition["companion"]["rules"]
    rules[:] = [existing for existing in rules if existing.get("target") != "avatar"]
    rules.append(rule)
    definition["reference"]["avatarReview"] = {
        "date": "2026-10-03", "sourceVersion": "3.13.0",
        "source": "src/components/avatar/avatar.styles.ts (dist/chunks/chunk.YUS4MAP3.js)",
        "report": "plans/theme-deep-review/web-awesome-avatar.md",
        "changes": ["default neutral plate and initials ink", "400-weight initials at 40% of actual avatar diameter"],
        "adaptations": [
            "Local S/M/L size selection retains En Reve's diameter scale; the source exposes a continuous --size property.",
            "Image/name ownership and automatic initials remain En Reve contracts; source icon fallback and shape prop vocabulary are not introduced by theme data.",
            "Public avatar size/radius overrides and forced-color system paint remain authoritative.",
        ],
        "verification": "pending coordinated compiler and rendered checks",
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[2])
    args = parser.parse_args()
    definitions = json.loads((args.root / "tooling/theme-candidates/definitions.json").read_text())
    definition = copy.deepcopy(next(item for item in definitions if item["id"] == "web-awesome-inspired"))
    before = copy.deepcopy(definition)
    update(definition)
    print(json.dumps({"changed": definition != before, "definition": definition}, indent=2))


if __name__ == "__main__":
    main()
