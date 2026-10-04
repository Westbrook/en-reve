#!/usr/bin/env python3
"""Prepare the pinned Web Awesome 3.13.0 source-slider companion mapping.

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


def color(red: int, green: int, blue: int) -> dict:
    return typed("color", {
        "colorSpace": "srgb",
        "components": [red / 255, green / 255, blue / 255],
        "alpha": 1,
    })


SOURCE_PREFIX = "theme.web-awesome-slider."
SIZE_METRICS = {
    # Source size s/m/l uses 14/16/20px at default root 16px and scale 1.
    # slider.styles.ts: track .5em, thumb 1.4em, border .125em.
    "Small": (7, 19.6, 1.75),
    "Medium": (8, 22.4, 2),
    "Large": (10, 28, 2.5),
}


def source_values(mode: str) -> dict:
    values = {
        "track-radius": dimension(9999),
        # A finite dimension role reproduces the circular source 50% radius.
        "thumb-radius": dimension(9999),
        "paint-duration": typed("duration", {"value": 0, "unit": "ms"}),
        "disabled-opacity": typed("number", 0.5),
        # The interval track already contains its thumbs: fade the subtree once.
        "disabled-thumb-opacity": typed("number", 1),
        "disabled-fill-opacity": typed("number", 1),
        "track-background": color(228, 229, 233) if mode == "light" else color(47, 50, 63),
        "thumb-border-color": color(255, 255, 255) if mode == "light" else color(16, 18, 25),
        # Preserve this definition's existing exact source blue, #0071ec, without
        # changing the theme's separately documented semantic contrast choices.
        "activated-background": typed("color", "{theme.button.primary.rest-background}"),
    }
    for size, (track, thumb, border) in SIZE_METRICS.items():
        suffix = size.lower()
        values[f"track-size-{suffix}"] = dimension(track)
        values[f"thumb-size-{suffix}"] = dimension(thumb)
        values[f"thumb-border-width-{suffix}"] = dimension(border)
    return values


def update(definition: dict) -> None:
    """Idempotently replace only this theme's source-slider presentation."""
    if definition.get("id") != "web-awesome-inspired":
        raise ValueError("Expected the canonical web-awesome-inspired definition.")
    reference = definition["reference"]
    if reference.get("version") != "3.13.0":
        raise ValueError("Expected the pinned Web Awesome 3.13.0 source version.")

    for mode in ("light", "dark"):
        source = definition["baseOptions"][mode].setdefault("source", {})
        source.setdefault("theme", {}).setdefault("web-awesome-slider", {}).update(source_values(mode))

    roles = {
        "trackRadius": SOURCE_PREFIX + "track-radius",
        "thumbRadius": SOURCE_PREFIX + "thumb-radius",
        "paintDuration": SOURCE_PREFIX + "paint-duration",
        "disabledOpacity": SOURCE_PREFIX + "disabled-opacity",
        "disabledThumbOpacity": SOURCE_PREFIX + "disabled-thumb-opacity",
        "disabledFillOpacity": SOURCE_PREFIX + "disabled-fill-opacity",
        "trackBackground": SOURCE_PREFIX + "track-background",
        "fillBackground": SOURCE_PREFIX + "activated-background",
        "hoverFillBackground": SOURCE_PREFIX + "activated-background",
        "pressedFillBackground": SOURCE_PREFIX + "activated-background",
        "hoverPressedFillBackground": SOURCE_PREFIX + "activated-background",
        "thumbBackground": SOURCE_PREFIX + "activated-background",
        "hoverThumbBackground": SOURCE_PREFIX + "activated-background",
        "pressedThumbBackground": SOURCE_PREFIX + "activated-background",
        "hoverPressedThumbBackground": SOURCE_PREFIX + "activated-background",
        "thumbBorderColor": SOURCE_PREFIX + "thumb-border-color",
        "hoverThumbBorderColor": SOURCE_PREFIX + "thumb-border-color",
        "pressedThumbBorderColor": SOURCE_PREFIX + "thumb-border-color",
        "disabledTrackBackground": SOURCE_PREFIX + "track-background",
        "disabledFillBackground": SOURCE_PREFIX + "activated-background",
        "disabledThumbBackground": SOURCE_PREFIX + "activated-background",
        "disabledThumbBorderColor": SOURCE_PREFIX + "thumb-border-color",
        "trackShadow": "shadow.none",
        "disabledTrackShadow": "shadow.none",
        "thumbShadow": "shadow.none",
        "thumbHoverShadow": "shadow.none",
        "thumbFocusShadow": "shadow.none",
        "disabledThumbShadow": "shadow.none",
    }
    for size in SIZE_METRICS:
        suffix = size.lower()
        roles[f"trackSize{size}"] = SOURCE_PREFIX + f"track-size-{suffix}"
        roles[f"thumbSize{size}"] = SOURCE_PREFIX + f"thumb-size-{suffix}"
        roles[f"thumbBorderWidth{size}"] = SOURCE_PREFIX + f"thumb-border-width-{suffix}"

    rules = definition["companion"]["rules"]
    rules[:] = [rule for rule in rules if rule["target"] != "source-slider"] + [{
        "target": "source-slider",
        "presentation": "filled",
        "tokens": {},
        "roles": roles,
    }]
    reference["sliderReview"] = {
        "date": "2026-10-03",
        "report": "plans/theme-deep-review/web-awesome-slider.md",
        "sourceVersion": "3.13.0",
        "changes": [
            "source s/m/l track, thumb and border geometry",
            "neutral track, blue thumb/fill and surface-colored rim",
            "shadow-free rest, hover and focus paint with one disabled subtree fade",
        ],
        "adaptations": [
            "The source's five em-scaled sizes map to En Reve Small/Medium/Large using source s/m/l at root 16px and font scale 1; arbitrary source font scaling is not claimed.",
            "The finite 9999px thumb radius reproduces the source circular 50% radius for the square thumb geometry.",
            "En Reve native and transactional value ownership, protected interaction targets, local hooks, RTL semantics and visible focus remain authoritative; source zero-offset thumb outline is not introduced by this paint mapping.",
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
