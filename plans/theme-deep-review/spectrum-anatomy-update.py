#!/usr/bin/env python3
"""Spectrum-only anatomy proposal, applied by root after shared registration.

Uses spectrum.ts, astryx.ts stateful-switch and source-shapes.ts filled-radio.
Default prints proposed counts; --apply writes only Spectrum baseOptions and
companion in definitions.json. Run spectrum-update.py first without its legacy
--with-companion-typography option; this proposal handles inherited sizes too.
"""
from __future__ import annotations

import argparse
from copy import deepcopy
import json
from pathlib import Path


def dim(px: float) -> dict:
    return {"value": px / 16, "unit": "rem"}


def color(value: str) -> dict:
    return {"colorSpace": "srgb", "components": [int(value[index:index + 2], 16) / 255 for index in (1, 3, 5)], "alpha": 1}


def update(definitions: list[dict]) -> list[dict]:
    result = deepcopy(definitions)
    spectrum = next(item for item in result if item["id"] == "spectrum-inspired")
    roles: dict[str, dict[str, str]] = {}
    for mode in ("light", "dark"):
        baseline = spectrum["baseOptions"][mode]
        source = baseline.setdefault("source", {}).setdefault("theme", {}).setdefault("spectrum", {}).setdefault("review", {})

        def token(name: str, kind: str, value: object) -> str:
            source[name] = {"$type": kind, "$value": value}
            return f"theme.spectrum.review.{name}"

        def sized(stem: str, name: str, values: tuple, kind: str = "dimension") -> dict[str, str]:
            return {stem + size.title(): token(f"{name}-{size}", kind, dim(value) if kind == "dimension" else value)
                    for size, value in zip(("small", "medium", "large"), values)}

        source_border = token("border-width", "dimension", {"value": 2, "unit": "px"})
        transparent = token("transparent", "color", {"colorSpace": "srgb", "components": [0, 0, 0], "alpha": 0})
        # Pinned @react-spectrum/s2 1.7.1 default neutral Checkbox/Switch/RadioGroup
        # paint. Interaction means hover, keyboard focus-visible, or pressed.
        # Invalid rest is distinct from the palette's active danger-text role.
        choice = {name: token(f"choice-{name}", "color", color(values[mode == "dark"])) for name, values in {
            "surface": ("#ffffff", "#111111"),
            "neutral": ("#292929", "#dbdbdb"),
            "neutral-interactive": ("#131313", "#f2f2f2"),
            "invalid": ("#d73220", "#fc432e"),
            "invalid-interactive": ("#b72818", "#ff6756"),
            "disabled": ("#c6c6c6", "#444444"),
        }.items()}
        roles["type"] = sized("lineHeight", "line-height", (16 / 12, 18 / 14, 20 / 16), "number")
        roles["choice"] = {**sized("size", "choice-size", (14, 16, 18)), "borderWidth": source_border}
        roles["checkbox"] = {
            **sized("radius", "checkbox-radius", (4, 4, 5)),
            "background": choice["surface"], "borderColor": choice["neutral"],
            "selectedBackground": choice["neutral"], "selectedColor": choice["surface"],
            "interactiveBorderColor": choice["neutral-interactive"],
            "interactiveSelectedBackground": choice["neutral-interactive"],
            "invalidBorderColor": choice["invalid"], "invalidBackground": choice["invalid"],
            "invalidSelectedColor": choice["surface"],
            "invalidInteractiveBorderColor": choice["invalid-interactive"],
            "invalidInteractiveBackground": choice["invalid-interactive"],
            "disabledBackground": choice["surface"], "disabledBorderColor": choice["disabled"],
            "disabledSelectedBackground": choice["disabled"], "disabledSelectedColor": choice["surface"],
        }
        roles["switch"] = {
            **sized("inlineSize", "switch-inline", ((26 / 14) * 12, 26, (26 / 14) * 16)),
            **sized("blockSize", "switch-block", (14, 16, 18)),
            **sized("thumbSize", "switch-thumb", (6, 8, 10)),
            **sized("checkedThumbSize", "switch-checked-thumb", (8, 10, 12)),
            **sized("inset", "switch-inset", (4, 4, 4)),
            **sized("checkedInset", "switch-checked-inset", (3, 3, 3)),
            "borderWidth": source_border,
            "background": choice["surface"], "checkedBackground": choice["neutral"],
            "borderColor": choice["neutral"], "checkedBorderColor": transparent,
            "thumbBackground": choice["neutral"], "checkedThumbBackground": choice["surface"],
            "thumbShadow": "shadow.none", "checkedThumbShadow": "shadow.none",
            "duration": "duration.fast", "ease": "ease.standard",
            "disabledBackground": choice["surface"], "disabledBorderColor": choice["disabled"],
            "disabledThumbBackground": choice["disabled"], "disabledCheckedBackground": choice["disabled"],
            "disabledCheckedBorderColor": transparent, "disabledCheckedThumbBackground": choice["surface"],
        }
        for state in ("hover", "focus", "pressed"):
            roles["switch"].update({
                f"{state}Background": choice["surface"],
                f"{state}BorderColor": choice["neutral-interactive"],
                f"{state}CheckedBackground": choice["neutral-interactive"],
                f"{state}CheckedBorderColor": transparent,
                f"{state}ThumbBackground": choice["neutral-interactive"],
                f"{state}CheckedThumbBackground": choice["surface"],
            })
        roles["radio"] = {
            "borderWidth": source_border,
            "dotSize": token("radio-center-size", "dimension", dim(4)),
            "background": choice["surface"], "border": choice["neutral"],
            "selectedBackground": choice["neutral"], "selectedDotColor": choice["surface"],
            "invalidBorder": choice["invalid"], "invalidSelectedBackground": choice["invalid"],
            "disabledBackground": choice["surface"], "disabledBorder": choice["disabled"],
            "disabledSelectedBackground": choice["disabled"], "disabledDotColor": choice["surface"],
        }
        for state in ("Hover", "Focus", "Pressed"):
            roles["radio"].update({
                f"{state.lower()}Border": choice["neutral-interactive"],
                f"selected{state}Background": choice["neutral-interactive"],
                f"invalid{state}Border": choice["invalid-interactive"],
                f"invalidSelected{state}Background": choice["invalid-interactive"],
            })
        # The optional public override must not mask the source state roles.
        # Filled local geometry keeps a matching border as a source-paint equivalent.
        baseline["pins"].pop("component.radio.selected-color", None)
        # S2 choices have no held inset shadow; retain the public override hooks.
        for family in ("checkbox", "radio", "switch"):
            baseline["pins"][f"component.{family}.pressed-shadow"] = "{shadow.none}"
        # Optional semantic hooks keep default choice labels source-neutral in
        # each state while retaining native/custom ownership and author overrides.
        for suffix, color_name in {
            "label-color": "neutral",
            "label-hover-color": "neutral-interactive",
            "label-focus-color": "neutral-interactive",
            "label-pressed-color": "neutral-interactive",
            "label-disabled-color": "disabled",
        }.items():
            baseline["pins"][f"component.choice.{suffix}"] = "{" + choice[color_name] + "}"
        # Field.tsx uses the same neutral interaction color for its focus perimeter.
        roles["focus"] = {"focusBorderColor": choice["neutral-interactive"], "invalidBorderColor": "color.danger-text"}
        roles["tabs"] = {
            "horizontalGap": token("tabs-gap-horizontal", "dimension", dim(32)),
            "verticalGap": token("tabs-gap-vertical", "dimension", {"value": 0, "unit": "px"}),
            "verticalInsetStart": token("tabs-vertical-inset-start", "dimension", dim(12)),
            "verticalInsetEnd": token("tabs-vertical-inset-end", "dimension", dim(20)),
        }
        roles["tab"] = {
            "indicatorSize": token("tab-indicator-size", "dimension", {"value": 2, "unit": "px"}),
            "indicatorRadius": token("tab-indicator-radius", "dimension", {"value": 9999, "unit": "px"}),
            "indicatorColor": choice["neutral"],
            "restColor": token("tab-rest-color", "color", color(("#505050", "#afafaf")[mode == "dark"])),
            "interactionColor": choice["neutral"], "selectedColor": choice["neutral"],
            "selectedInteractionColor": choice["neutral-interactive"],
            "minBlockSize": token("tab-min-block-size", "dimension", dim(48)),
            "inlinePadding": token("tab-inline-padding", "dimension", {"value": 0, "unit": "px"}),
            "blockPadding": token("tab-block-padding", "dimension", {"value": 0, "unit": "px"}),
            "disabledColor": choice["disabled"],
            "disabledIndicatorColor": token("tab-disabled-indicator-color", "color", color(("#e9e9e9", "#2c2c2c")[mode == "dark"])),
        }
        roles["verticalTab"] = {
            "indicatorSize": roles["tab"]["indicatorSize"],
            "indicatorOffset": token("tab-indicator-offset", "dimension", {"value": 12, "unit": "px"}),
        }
        baseline["pins"]["component.tab.pressed-background"] = "{theme.spectrum.review.transparent}"
        for pin in ("hover-color", "selected-color", "pressed-color", "indicator-color"):
            baseline["pins"].pop(f"component.tab.{pin}", None)

    rules = spectrum["companion"]["rules"]
    for target, presentation, group in (
        ("spectrum-control", "source-size", "type"),
        ("sized-choice", "source-size", "choice"),
        ("spectrum-checkbox", "neutral-selected", "checkbox"),
        ("spectrum-field", "neutral-focus", "focus"),
        ("stateful-switch", "stateful", "switch"),
        ("filled-radio", "filled", "radio"),
        ("spectrum-tabs", "static-line", "tabs"),
        ("spectrum-tab", "static-line", "tab"),
        ("spectrum-vertical-tab", "static-line", "verticalTab"),
    ):
        rule = next((item for item in rules if item.get("target") == target and item.get("presentation") == presentation), None)
        if rule is None:
            rule = {"target": target, "presentation": presentation, "tokens": {}, "roles": {}}
            rules.append(rule)
        rule.setdefault("roles", {}).update(roles[group])
    # Source controlFont uses regular weight for every choice label and size.
    choice_rule = next((item for item in rules if item.get("target") == "choice" and not item.get("presentation")), None)
    if choice_rule is None:
        choice_rule = {"target": "choice", "tokens": {}}
        rules.append(choice_rule)
    choice_rule.setdefault("tokens", {})["--en-font-label-strong-weight"] = "font.ui.weight"
    assert [item for item in result if item["id"] != "spectrum-inspired"] == [
        item for item in definitions if item["id"] != "spectrum-inspired"
    ]
    return result


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[2])
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    path = args.root.resolve() / "tooling/theme-candidates/definitions.json"
    before_text = path.read_text()
    before = json.loads(before_text)
    after = update(before)
    if args.apply and before != after:
        # Preserve every other theme byte-for-byte, including escaped title text.
        blocks = [json.dumps(next(item for item in document if item["id"] == "spectrum-inspired"),
                             indent=2, ensure_ascii=False).replace("\n", "\n  ") for document in (before, after)]
        if before_text.count(blocks[0]) != 1:
            raise ValueError("Expected one canonically formatted Spectrum definition")
        path.write_text(before_text.replace(blocks[0], blocks[1], 1))
    print(json.dumps({"mode": "applied" if args.apply else "proposal only", "changed": before != after,
                      "theme": "spectrum-inspired", "file": str(path), "presentationRules": 9}, indent=2))


if __name__ == "__main__":
    main()
