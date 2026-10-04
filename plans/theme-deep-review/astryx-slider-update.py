#!/usr/bin/env python3
"""Prepared Astryx slider mapping; import and call update(definition).

This module performs no I/O, application, builds or tests. The coordinator owns
serial recipe updates after the shared source-slider presentation is integrated.
"""

from __future__ import annotations

import re

REVISION = "d2daa25689f6e7552df17b10194eec4ad34f7575"
SOURCE_ROOT = f"https://github.com/facebook/astryx/blob/{REVISION}/"


def token_segment(name: str) -> str:
    # Preserve public companion role keys while authoring valid source paths.
    return re.sub(r"([a-z0-9])([A-Z])", r"\1-\2", name).lower()


def color(value: str) -> dict:
    result = {"colorSpace": "srgb", "components": [
        int(value[index:index + 2], 16) / 255 for index in (0, 2, 4)
    ]}
    if len(value) == 8:
        result["alpha"] = int(value[6:8], 16) / 255
    return result


def composite(foreground: dict, background: dict) -> dict:
    fa, ba = foreground.get("alpha", 1), background.get("alpha", 1)
    alpha = fa + ba * (1 - fa)
    return {"colorSpace": "srgb", "components": [
        (f * fa + b * ba * (1 - fa)) / alpha
        for f, b in zip(foreground["components"], background["components"])
    ], "alpha": alpha}


def hover(primary: dict, mode: str) -> dict:
    # The source uses color-mix(in srgb, accent, tint-hover 15%). Both
    # operands are opaque, so ordinary channel interpolation is exact.
    tint = 0 if mode == "light" else 1
    return {"colorSpace": "srgb", "components": [
        channel * 0.85 + tint * 0.15 for channel in primary["components"]
    ]}


def update(definition: dict) -> list[str]:
    """Idempotently replace only this Astryx definition's slider mapping."""
    if definition.get("id") != "astryx-inspired":
        raise ValueError("Astryx slider updater accepts only astryx-inspired")
    mappings = None
    for mode in ("light", "dark"):
        source = definition["baseOptions"][mode]["source"]
        primary = color("15110C" if mode == "light" else "DFE2E5")
        track = color("CCD3DB" if mode == "light" else "5A5E66")
        muted = color("0536590C" if mode == "light" else "1111127F")
        pressed_overlay = color("05365919" if mode == "light" else "FFFFFF19")
        values = {}

        def add(name: str, kind: str, value: object) -> None:
            values[name] = {"$type": kind, "$value": value}

        def length(name: str, value: float) -> None:
            add(name, "dimension", {"value": value, "unit": "px"})

        # Current source exposes one fixed visual profile, independently of the
        # host field size. Preserve that truth instead of inventing sm/md/lg.
        for size in ("Small", "Medium", "Large"):
            length(f"trackSize{size}", 4)
            length(f"thumbSize{size}", 20)
        length("trackRadius", 9999)
        length("thumbRadius", 9999)
        length("thumbBorderWidth", 0)
        add("paintDuration", "duration", {"value": 175, "unit": "ms"})
        for name in ("trackShadow", "thumbShadow", "thumbHoverShadow", "thumbFocusShadow",
                     "disabledTrackShadow", "disabledThumbShadow"):
            add(name, "shadow", "{shadow.none}")
        for name in ("thumbBorderColor", "disabledThumbBorderColor"):
            add(name, "color", color("00000000"))
        for name in ("trackBackground", "disabledTrackBackground"):
            add(name, "color", track)
        for name in ("fillBackground", "hoverFillBackground", "pressedFillBackground", "hoverPressedFillBackground", "disabledFillBackground", "thumbBackground"):
            add(name, "color", primary)
        add("hoverThumbBackground", "color", hover(primary, mode))
        add("pressedThumbBackground", "color", composite(pressed_overlay, primary))
        add("hoverPressedThumbBackground", "color", composite(pressed_overlay, hover(primary, mode)))
        add("disabledThumbBackground", "color", muted)
        add("disabledOpacity", "number", 0.5)
        add("disabledFillOpacity", "number", 1)
        add("disabledThumbOpacity", "number", 1)
        source.setdefault("theme", {}).setdefault("astryx", {})["slider"] = {
            token_segment(name): value for name, value in values.items()
        }
        current = {name: f"theme.astryx.slider.{token_segment(name)}" for name in values}
        if mappings is not None and mappings != current:
            raise ValueError("Astryx slider appearance role mappings differ")
        mappings = current

    rule = {"target": "source-slider", "presentation": "filled", "tokens": {}, "roles": mappings}
    rules = definition["companion"]["rules"]
    rules[:] = [entry for entry in rules if entry["target"] != "source-slider"] + [rule]
    definition["reference"]["sliderDeepReview"] = {
        "sourceCommit": REVISION,
        "source": SOURCE_ROOT + "packages/core/src/Slider/Slider.tsx",
        "palette": SOURCE_ROOT + "apps/docsite/src/themes/astryxTheme.ts",
        "tokens": SOURCE_ROOT + "packages/core/src/theme/tokens.stylex.ts",
        "geometry": "Source fixed4px track/20px thumb is mapped equally across all En Reve size profiles; no source size axis exists.",
        "adaptations": [
            "Protected host target floors, native interval semantics, focus outlines, forced colors and reduced motion remain component-owned.",
            "Source thumb/track visual geometry does not replace the host's value-to-position or drag ownership contracts.",
        ],
    }
    return ["Astryx source-slider prepared: all profiles4px track/20px thumb, no border/shadow, branded primary fill/thumb, source hover and held paint, disabled control opacity0.5."]
