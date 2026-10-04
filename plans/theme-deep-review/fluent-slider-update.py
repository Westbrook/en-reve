#!/usr/bin/env python3
"""Coordinator-owned, idempotent Fluent source-slider recipe update.

Import and call update(definition); this module performs no file I/O and has no
apply command. It edits only the supplied Fluent definition's baseOptions and
source-slider / filled companion rule. Source: @fluentui/react-slider 9.6.5
(the pinned @fluentui/react-components 9.74.7 showcase installation) and
@fluentui/tokens 1.0.0-alpha.24. Large deliberately repeats source medium.
"""
from __future__ import annotations


def color(hex_value):
    return {
        "colorSpace": "srgb",
        "components": [int(hex_value[index:index + 2], 16) / 255 for index in (1, 3, 5)],
    }


def dimension(value):
    return {"value": value, "unit": "px"}


def token(type_, value):
    return {"$type": type_, "$value": value}


def update(definition):
    """Install finite slider roles without replacing other theme recipes."""
    if definition.get("id") != "fluent-inspired":
        raise ValueError("The Fluent slider updater accepts only fluent-inspired")

    # Neutral values are exact upstream source tokens. Brand fill follows this
    # theme's already documented rose compound-brand adaptation. Hover/pressed
    # paint changes the filled rail and thumb center together, not the neutral
    # rail or outer border. Fluent's source has no paint tween or drop shadow.
    palettes = {
        "light": {
            "track": "#616161", "thumb-border": "#d1d1d1", "thumb-rim": "#ffffff",
            "hover": "#954355", "pressed": "#682f3d",
            "disabled-track": "#f0f0f0", "disabled-mark": "#bdbdbd",
        },
        "dark": {
            "track": "#adadad", "thumb-border": "#666666", "thumb-rim": "#292929",
            "hover": "#fad6dc", "pressed": "#db7488",
            "disabled-track": "#141414", "disabled-mark": "#5c5c5c",
        },
    }
    for mode, palette in palettes.items():
        source = definition["baseOptions"][mode].setdefault("source", {})
        values = source.setdefault("theme", {}).setdefault("fluent-slider", {})
        values.update({name: token("color", color(value)) for name, value in palette.items()})
        for name, sizes in {
            "track-size": (2, 4, 4),
            "thumb-size": (16, 20, 20),
            "thumb-border-width": (0.8, 1, 1),
            "thumb-rim-width": (3.2, 4, 4),
        }.items():
            for size, value in zip(("small", "medium", "large"), sizes):
                values[f"{name}-{size}"] = token("dimension", dimension(value))
        values.update({
            "track-radius": token("dimension", dimension(8)),
            "thumb-radius": token("dimension", dimension(10000)),
            "paint-duration": token("duration", {"value": 0, "unit": "ms"}),
            "opaque": token("number", 1),
            # Typed zero shadow suppresses inherited drop elevation. The finite
            # rim roles generate the inset ring with total source thickness,
            # accounting for the outer CSS border at each inherited size.
            "no-shadow": token("shadow", [{
                "color": {"colorSpace": "srgb", "components": [0, 0, 0], "alpha": 0},
                "offsetX": dimension(0), "offsetY": dimension(0),
                "blur": dimension(0), "spread": dimension(0),
            }]),
        })

    prefix = "theme.fluent-slider."
    roles = {
        "trackRadius": prefix + "track-radius",
        "thumbRadius": prefix + "thumb-radius",
        "paintDuration": prefix + "paint-duration",
        "trackBackground": prefix + "track",
        "fillBackground": "color.action-text",
        "hoverFillBackground": prefix + "hover",
        "pressedFillBackground": prefix + "pressed",
        "trackShadow": prefix + "no-shadow",
        "thumbBackground": "color.action-text",
        "hoverThumbBackground": prefix + "hover",
        "pressedThumbBackground": prefix + "pressed",
        "thumbBorderColor": prefix + "thumb-border",
        "thumbRimColor": prefix + "thumb-rim",
        "thumbShadow": prefix + "no-shadow",
        "disabledTrackBackground": prefix + "disabled-track",
        "disabledTrackShadow": prefix + "no-shadow",
        "disabledFillBackground": prefix + "disabled-mark",
        "disabledThumbBackground": prefix + "disabled-mark",
        "disabledThumbBorderColor": prefix + "disabled-mark",
        "disabledFillOpacity": prefix + "opaque",
        "disabledOpacity": prefix + "opaque",
        "disabledThumbOpacity": prefix + "opaque",
    }
    for role, name in {
        "trackSize": "track-size", "thumbSize": "thumb-size",
        "thumbBorderWidth": "thumb-border-width", "thumbRimWidth": "thumb-rim-width",
    }.items():
        for size in ("Small", "Medium", "Large"):
            roles[role + size] = prefix + name + "-" + size.lower()

    rules = definition.setdefault("companion", {}).setdefault("rules", [])
    existing = next((rule for rule in rules if rule.get("target") == "source-slider"
                     and rule.get("presentation") == "filled"), None)
    if existing is None:
        rules.append({"target": "source-slider", "presentation": "filled", "tokens": {}, "roles": roles})
    else:
        existing.setdefault("tokens", {})
        existing.setdefault("roles", {}).update(roles)
