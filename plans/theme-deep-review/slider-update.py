#!/usr/bin/env python3
"""Prepare Radix Themes / shadcn Rhea slider fidelity mappings.

Default is a read-only preview; --apply writes only these two theme definitions.
Requires the registered source-slider/filled companion with the complete state
roles below. No build, generation, browser, source acquisition or commit occurs.
See slider-mapping.md for immutable source references and host adaptations.
"""

import argparse
import copy
import json
import re
from pathlib import Path


THEMES = ("radix-inspired", "shadcn-inspired")
TARGET = "source-slider"
FAMILY = "slider-fidelity"
ROLE_TYPES = {
    **{f"{stem}{size}": "dimension" for stem in ("trackSize", "thumbSize") for size in ("Small", "Medium", "Large")},
    "trackRadius": "dimension", "thumbRadius": "dimension", "thumbBorderWidth": "dimension", "paintDuration": "duration",
    "trackBackground": "color", "fillBackground": "color", "trackShadow": "shadow",
    "hoverFillBackground": "color", "pressedFillBackground": "color",
    "thumbBackground": "color", "thumbBorderColor": "color", "thumbShadow": "shadow",
    "hoverThumbBackground": "color", "pressedThumbBackground": "color",
    "thumbHoverShadow": "shadow", "thumbFocusShadow": "shadow",
    "disabledTrackBackground": "color", "disabledFillBackground": "color", "disabledTrackShadow": "shadow",
    "disabledThumbBackground": "color", "disabledThumbBorderColor": "color", "disabledThumbShadow": "shadow",
    "disabledFillOpacity": "number", "disabledOpacity": "number", "disabledThumbOpacity": "number",
}


def token_name(role):
    return re.sub(r"[A-Z]", lambda match: "-" + match[0].lower(), role)


def dimension(value, unit="px"):
    return {"value": value, "unit": unit}


def color(hex_value, alpha=None):
    value = hex_value.removeprefix("#")
    result = {"colorSpace": "srgb", "components": [int(value[index:index + 2], 16) / 255 for index in (0, 2, 4)]}
    result["alpha"] = alpha if alpha is not None else int(value[6:8], 16) / 255 if len(value) == 8 else 1
    return result


def shadow(ink, *, x=0, y=0, blur=0, spread=0, inset=False):
    result = {"color": copy.deepcopy(ink), "offsetX": dimension(x), "offsetY": dimension(y),
              "blur": dimension(blur), "spread": dimension(spread)}
    if inset:
        result["inset"] = True
    return result


def geometry(tracks, thumbs, *, radius, duration):
    values = {"trackRadius": dimension(radius), "thumbRadius": dimension(radius), "thumbBorderWidth": dimension(0),
              "paintDuration": dimension(duration, "ms")}
    for index, size in enumerate(("Small", "Medium", "Large")):
        values[f"trackSize{size}"] = dimension(tracks[index])
        values[f"thumbSize{size}"] = dimension(thumbs[index])
    return values


def radix_values(mode):
    light = mode == "light"
    gray_a3 = color("#0000330f" if light else "#ddeaf814")
    gray_a4 = color("#00002d17" if light else "#d3edf81d")
    gray_a5 = color("#0009321f" if light else "#d9edfe25")
    gray1 = color("#fcfcfd" if light else "#111113")
    gray6 = color("#d9d9e0" if light else "#363a3f")
    accent9 = color("#3e63dd")
    accent3 = color("#edf2fe" if light else "#182449")
    accent8 = color("#8da4ef" if light else "#435db1")
    white = color("#ffffff")
    thumb_shadow = [shadow(color("#000000", .2), spread=1)]
    # Track + space1 + visible overshoot yields 13/16/19px painted thumbs.
    values = geometry((6, 8, 10), (13, 16, 19), radius=9999, duration=0)
    values.update({
        "trackBackground": gray_a3, "fillBackground": accent9,
        "hoverFillBackground": accent9, "pressedFillBackground": accent9,
        "trackShadow": [shadow(gray_a5, spread=1, inset=True)],
        "thumbBackground": white, "thumbBorderColor": color("#000000", 0), "thumbShadow": thumb_shadow,
        "hoverThumbBackground": white, "pressedThumbBackground": white, "thumbHoverShadow": thumb_shadow,
        "thumbFocusShadow": thumb_shadow + [shadow(accent3, spread=3), shadow(accent8, spread=5)],
        "disabledTrackBackground": gray_a3, "disabledFillBackground": gray_a3,
        "disabledTrackShadow": [shadow(gray_a4, spread=1, inset=True)],
        "disabledThumbBackground": gray1, "disabledThumbBorderColor": color("#000000", 0),
        "disabledThumbShadow": [shadow(gray6, spread=1)],
        # Source disabled range vanishes. Native gradients use the track color
        # while interval fill opacity removes its separate painted segment.
        "disabledFillOpacity": 0, "disabledOpacity": 1, "disabledThumbOpacity": 1,
    })
    return values


def literal_color(value, label):
    if not isinstance(value, dict) or value.get("colorSpace") != "srgb" or len(value.get("components", [])) != 3:
        raise ValueError(f"Expected the reviewed literal sRGB source color for {label}; review changed inputs before applying")
    return copy.deepcopy(value)


def managed_color(root, theme, mode, token_id):
    operations = json.loads((root / "tooling/theme-candidates" / theme["inputs"][mode]).read_text())
    matches = [operation for operation in operations if operation.get("type") == "token" and operation.get("id") == token_id]
    if len(matches) != 1:
        raise ValueError(f"Expected one reviewed {theme['id']} {mode} {token_id} input")
    return literal_color(matches[0]["value"], token_id)


def shadcn_values(root, theme, mode, branch):
    # The pinned selected Neutral branch already supplies input/50. Preserve
    # its underlying color and scale alpha to input/90, avoiding a canvas bake.
    input50 = branch["source"]["component"]["input"]["background"]
    if input50.get("$type") != "color":
        raise ValueError("The shadcn input background is no longer the reviewed color token")
    track = literal_color(input50["$value"], "component.input.background")
    track["alpha"] = track.get("alpha", 1) * 1.8
    if not 0 <= track["alpha"] <= 1:
        raise ValueError("Expected an input/50 source alpha before projecting input/90")
    primary = managed_color(root, theme, mode, "palette.accent")
    # Existing family focus-halo paint retains the exact source ring/30 rather
    # than the intentionally stronger shared solid keyboard-outline color.
    halo = managed_color(root, theme, mode, "component.input.focus-halo-color")
    if abs(halo.get("alpha", 1) - .3) > 1e-12:
        raise ValueError("Expected the reviewed shadcn ring/30 source halo")
    white = color("#ffffff")
    elevation = [shadow(color("#000000", .1), y=4, blur=6, spread=-1),
                 shadow(color("#000000", .1), y=2, blur=4, spread=-2)]
    thumb_shadow = [shadow(color("#000000", .1), spread=1)] + elevation
    # Tailwind's hover/focus ring replaces the 1px black ring; it does not stack.
    hover_shadow = [shadow(halo, spread=4)] + elevation
    no_shadow = shadow(color("#000000", 0))
    values = geometry((4, 4, 4), (16, 16, 16), radius=18, duration=200)
    values.update({
        "trackBackground": track, "fillBackground": primary, "trackShadow": no_shadow,
        "hoverFillBackground": primary, "pressedFillBackground": primary,
        "thumbBackground": white, "thumbBorderColor": color("#000000", 0), "thumbShadow": thumb_shadow,
        "hoverThumbBackground": white, "pressedThumbBackground": white,
        "thumbHoverShadow": hover_shadow, "thumbFocusShadow": hover_shadow,
        "disabledTrackBackground": track, "disabledFillBackground": primary, "disabledTrackShadow": no_shadow,
        "disabledThumbBackground": white, "disabledThumbBorderColor": color("#000000", 0), "disabledThumbShadow": thumb_shadow,
        # Base/Rhea declares .5 on the disabled Control and again on the Thumb.
        "disabledFillOpacity": 1, "disabledOpacity": .5, "disabledThumbOpacity": .5,
    })
    return values


def proposal(definitions, root):
    result = copy.deepcopy(definitions)
    for theme_id in THEMES:
        matches = [entry for entry in result if entry.get("id") == theme_id]
        if len(matches) != 1:
            raise ValueError(f"Expected one {theme_id} definition")
        theme = matches[0]
        for mode in ("light", "dark"):
            branch = theme["baseOptions"][mode]
            values = radix_values(mode) if theme_id == "radix-inspired" else shadcn_values(root, theme, mode, branch)
            if set(values) != set(ROLE_TYPES):
                raise ValueError(f"Incomplete slider source roles for {theme_id}/{mode}")
            branch["source"].setdefault("theme", {})[FAMILY] = {
                token_name(role): {"$type": ROLE_TYPES[role], "$value": copy.deepcopy(value)}
                for role, value in values.items()
            }
        rules = theme["companion"]["rules"]
        rules[:] = [rule for rule in rules if rule.get("target") != TARGET or rule.get("variant")]
        rules.append({"target": TARGET, "presentation": "filled", "tokens": {},
                      "roles": {role: f"theme.{FAMILY}.{token_name(role)}" for role in ROLE_TYPES}})
        theme.setdefault("reference", {})["sliderReview"] = "plans/theme-deep-review/slider-mapping.md"
    assert [entry for entry in result if entry.get("id") not in THEMES] == [entry for entry in definitions if entry.get("id") not in THEMES]
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[2])
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    root = args.root.resolve()
    path = root / "tooling/theme-candidates/definitions.json"
    original = path.read_text()
    definitions = json.loads(original)
    result = proposal(definitions, root)
    if proposal(result, root) != result:
        raise RuntimeError("Slider mapping is not idempotent")
    print(json.dumps({"mode": "apply" if args.apply else "preview", "path": str(path),
                      "themes": THEMES, "target": TARGET, "changed": result != definitions}, indent=2))
    if args.apply:
        authoring = (root / "packages/tokens/src/authoring.ts").read_text()
        module = (root / "packages/tokens/src/companion/slider.ts").read_text()
        if "sliderTargets" not in authoring or "sliderPresentations" not in authoring:
            raise RuntimeError("Register the source-slider companion before applying its mapping")
        required = ("disabledTrackShadow", "disabledFillOpacity", "disabledOpacity", "disabledThumbOpacity",
                    "hoverFillBackground", "pressedFillBackground", "hoverThumbBackground", "pressedThumbBackground")
        if any(role not in module for role in required):
            raise RuntimeError("Complete the source-slider state roles before applying this mapping")
        if path.read_text() != original:
            raise RuntimeError("Definitions changed during preparation; retry after coordinating writers")
        if result != definitions:
            path.write_text(json.dumps(result, indent=2, ensure_ascii=True) + "\n")


if __name__ == "__main__":
    main()
