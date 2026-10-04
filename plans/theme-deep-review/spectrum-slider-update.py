#!/usr/bin/env python3
"""Pure, idempotent Spectrum slider proposal; root applies it serially.

Input/output is one theme definition. This module performs no file I/O and has
no apply entry point. Other theme definitions are returned unchanged by value.

Source: @react-spectrum/s2 1.7.1, commit
4dd44e0f400636a87a9ad4390903e78c5ae6113c, src/Slider.tsx and
src/RangeSlider.tsx. Color values were verified by following the corresponding
state classes in the same package's dist/private/Slider.mjs and Slider.css.
https://github.com/adobe/react-spectrum/blob/4dd44e0f400636a87a9ad4390903e78c5ae6113c/packages/%40react-spectrum/s2/src/Slider.tsx

Maps the source's default thin, neutral, circular-thumb presentation only.
Source precise/thick variants and dimension-dependent pressScale are not
invented as En Reve variants. Protected target geometry and forced colors
remain component-owned; public local slider hooks retain precedence.
"""
from __future__ import annotations

from copy import deepcopy


def _dimension(px: float) -> dict:
    return {"value": px / 16, "unit": "rem"}


def _color(hex_value: str) -> dict:
    return {
        "colorSpace": "srgb",
        "components": [int(hex_value[index:index + 2], 16) / 255 for index in (0, 2, 4)],
        "alpha": 1,
    }


def update(definition: dict) -> dict:
    """Return a copy with only Spectrum's source-slider mapping added/revised."""
    result = deepcopy(definition)
    if result.get("id") != "spectrum-inspired":
        return result

    roles: dict[str, str] = {}
    for mode, palette in {
        "light": {
            "track": "dadada", "fill": "505050", "thumb": "ffffff",
            "border": "292929", "active-border": "131313",
            "disabled-track": "e9e9e9", "disabled-border": "dadada",
        },
        "dark": {
            "track": "393939", "fill": "afafaf", "thumb": "111111",
            "border": "dbdbdb", "active-border": "f2f2f2",
            "disabled-track": "2c2c2c", "disabled-border": "393939",
        },
    }.items():
        source = (result["baseOptions"][mode].setdefault("source", {})
                  .setdefault("theme", {}).setdefault("spectrum", {})
                  .setdefault("slider", {}))

        def token(name: str, kind: str, value: object) -> str:
            source[name] = {"$type": kind, "$value": value}
            return f"theme.spectrum.slider.{name}"

        colors = {name: token(name, "color", _color(value)) for name, value in palette.items()}
        roles = {
            **{f"trackSize{size.title()}": token(f"track-size-{size}", "dimension", _dimension(4))
               for size in ("small", "medium", "large")},
            **{f"thumbSize{size.title()}": token(f"thumb-size-{size}", "dimension", _dimension(px))
               for size, px in (("small", 18), ("medium", 20), ("large", 22))},
            "trackRadius": token("track-radius", "dimension", _dimension(10)),
            "thumbRadius": token("thumb-radius", "dimension", {"value": 9999, "unit": "px"}),
            "thumbBorderWidth": token("thumb-border-width", "dimension", {"value": 2, "unit": "px"}),
            # Source Slider styles declare no paint transition or elevation.
            # Focus remains the component's separate immediate focus contour.
            "paintDuration": token("paint-duration", "duration", {"value": 0, "unit": "ms"}),
            "trackBackground": colors["track"],
            "fillBackground": colors["fill"],
            "hoverFillBackground": colors["fill"],
            "pressedFillBackground": colors["fill"],
            "trackShadow": "shadow.none",
            "thumbBackground": colors["thumb"],
            "hoverThumbBackground": colors["thumb"],
            "pressedThumbBackground": colors["thumb"],
            "thumbBorderColor": colors["border"],
            "hoverThumbBorderColor": colors["active-border"],
            "pressedThumbBorderColor": colors["active-border"],
            "thumbShadow": "shadow.none",
            "thumbHoverShadow": "shadow.none",
            "thumbFocusShadow": "shadow.none",
            "disabledTrackBackground": colors["disabled-track"],
            "disabledFillBackground": colors["disabled-track"],
            "disabledTrackShadow": "shadow.none",
            "disabledThumbBackground": colors["thumb"],
            "disabledThumbBorderColor": colors["disabled-border"],
            "disabledThumbShadow": "shadow.none",
            # S2 uses explicit disabled colors, with no additional opacity fade.
            "disabledOpacity": token("disabled-opacity", "number", 1),
            "disabledThumbOpacity": token("disabled-thumb-opacity", "number", 1),
            "disabledFillOpacity": token("disabled-fill-opacity", "number", 1),
        }

    rules = result.setdefault("companion", {}).setdefault("rules", [])
    rule = next((item for item in rules if item.get("target") == "source-slider"
                 and item.get("presentation") == "filled"), None)
    if rule is None:
        rule = {"target": "source-slider", "presentation": "filled", "tokens": {}, "roles": {}}
        rules.append(rule)
    rule.setdefault("roles", {}).update(roles)
    return result
