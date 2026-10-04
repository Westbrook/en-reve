#!/usr/bin/env python3
"""Prepare Rhea anatomy mappings after root integrates the typed companion engine.

Default is read-only. --apply writes only shadcn-inspired in definitions.json.
Source: retained a87a63b2ca25143d26c8bd0903e4e9bc77b3f824 Rhea CSS and Base
Tooltip/Tabs wrappers. Exact source paint is retained unless annotated below.
"""

import argparse
import copy
import json
from pathlib import Path


def typed(kind, value):
    return {"$type": kind, "$value": value}


def dim(value, unit="px"):
    return typed("dimension", {"value": value, "unit": unit})


def color(components, alpha=1):
    return typed("color", {"colorSpace": "srgb", "components": components, "alpha": alpha})


def alias(kind, value):
    return typed(kind, "{" + value + "}")


def rule(target, presentation, roles):
    return {"target": target, "presentation": presentation, "tokens": {}, "roles": {
        role: value if value.startswith(("color.", "font.", "shadow.", "component.", "size.", "duration.", "ease.", "layout.")) else "theme.shadcn-shape." + value
        for role, value in roles.items()
    }}


RULES = [
    rule("filled-radio", "filled", {
        "borderWidth": "line-width", "dotSize": "radio-dot", "background": "choice-background",
        # Preserve the previously disclosed stronger functional boundary.
        "border": "color.boundary", "selectedBackground": "color.action", "selectedDotColor": "color.on-action",
        "disabledOpacity": "disabled-opacity", "gap": "choice-gap",
    }),
    rule("stateful-switch", "stateful", {
        "inlineSizeSmall": "size.switch-inline-small", "inlineSizeMedium": "size.switch-inline-medium", "inlineSizeLarge": "size.switch-inline-medium",
        "blockSizeSmall": "size.switch-block-small", "blockSizeMedium": "size.switch-block-medium", "blockSizeLarge": "size.switch-block-medium",
        "thumbSizeSmall": "size.switch-thumb-small", "thumbSizeMedium": "size.switch-thumb-medium", "thumbSizeLarge": "size.switch-thumb-medium",
        "checkedThumbSizeSmall": "size.switch-thumb-small", "checkedThumbSizeMedium": "size.switch-thumb-medium", "checkedThumbSizeLarge": "size.switch-thumb-medium",
        "insetSmall": "switch-inset", "insetMedium": "switch-inset", "insetLarge": "switch-inset",
        "checkedInsetSmall": "switch-inset", "checkedInsetMedium": "switch-inset", "checkedInsetLarge": "switch-inset",
        "borderWidth": "switch-border-width", "borderColor": "color.boundary", "checkedBorderColor": "color.action",
        "background": "choice-background", "checkedBackground": "color.action",
        "thumbBackground": "switch-thumb", "checkedThumbBackground": "color.on-action",
        "thumbShadow": "thumb-shadow", "checkedThumbShadow": "thumb-shadow", "disabledOpacity": "disabled-opacity",
    }),
    rule("tooltip", "compact", {
        "background": "color.text", "color": "color.canvas", "borderWidth": "zero", "shadow": "shadow.none",
        "fontSize": "small-text", "lineHeight": "small-line-height", "fontWeight": "regular-weight",
        "radius": "tooltip-radius", "maxInlineSize": "tooltip-maximum", "paddingInline": "tooltip-inline", "paddingBlock": "tooltip-block",
    }),
    rule("padded-dialog", "padded", {
        "padding": "dialog-padding", "gap": "dialog-gap", "maxRadius": "dialog-radius-cap",
        "fillInlineSize": "layout.form-max", "fillBreakpoint": "dialog-fill-breakpoint",
        "fontSize": "font.ui.size", "lineHeight": "font.ui.line-height", "weight": "regular-weight",
        "titleFontSize": "overlay-title-size", "titleLineHeight": "dialog-title-line", "titleWeight": "medium-weight",
        "footerGap": "dialog-footer-gap", "descriptionColor": "color.text-muted", "backdropBlur": "dialog-backdrop-blur",
    }),
    rule("padded-popover", "padded", {
        "padding": "popover-padding", "gap": "popover-gap", "radius": "popover-radius",
        "fontSize": "font.ui.size", "lineHeight": "font.ui.line-height", "weight": "regular-weight",
        "titleFontSize": "overlay-title-size", "titleLineHeight": "popover-title-line", "titleWeight": "medium-weight",
    }),
    rule("enclosed-tabs", "enclosed", {
        "radius": "control-radius", "padding": "tabs-inset", "verticalPadding": "tabs-vertical-inset",
        "gap": "zero", "contentGap": "tabs-content-gap", "background": "color.surface-subtle", "color": "color.text-muted",
    }),
    rule("enclosed-tab", "enclosed", {
        "radius": "control-radius", "inlinePadding": "tab-inline", "blockPadding": "tab-block", "minimumSize": "tab-minimum",
        "fontSize": "font.ui.size", "lineHeight": "font.ui.line-height", "weight": "medium-weight",
        "background": "transparent", "color": "tab-rest-color", "hoverBackground": "transparent", "hoverColor": "color.text",
        "selectedBackground": "tab-selected-background", "selectedColor": "color.text", "disabledOpacity": "disabled-opacity",
    }),
    rule("enclosed-tab-panel", "flush", {}),
    rule("inset-card", "inset", {
        "maxRadius": "card-radius-cap",
        "gapSmall": "card-small-spacing", "gapMedium": "card-spacing", "gapLarge": "card-spacing",
        "titleFontSize": "card-title-size", "titleLineHeight": "card-title-line-height", "titleWeight": "medium-weight", "headerGap": "card-header-gap",
    }),
    rule("badge", "badge-subtle", {"minimum-size": "badge-minimum", "inline-padding": "badge-inline", "gap": "badge-gap"}),
    rule("tag", "tag-surface", {
        "background": "component.editor-token.background", "color": "color.text", "shadow": "shadow.none", "radius": "control-radius",
        "font-size": "small-text", "line-height": "small-line-height", "inline-padding": "chip-inline", "gap": "chip-gap", "minimum-size": "chip-minimum",
    }),
    rule("themed-code", "typeface", {"family": "font.code.family"}),
    rule("compact-keycap", "compact", {
        "family": "font.ui.family", "fontSize": "small-text", "lineHeight": "small-line-height", "weight": "medium-weight",
        "radius": "keycap-radius", "minimumSize": "keycap-minimum", "inlinePadding": "keycap-inline", "background": "color.surface-subtle", "color": "color.text-muted",
    }),
    rule("accordion-item", "outline", {
        "fontSize": "font.ui.size", "lineHeight": "font.ui.line-height", "weight": "medium-weight",
        "radius": "zero", "gap": "accordion-gap", "blockPadding": "accordion-padding", "panelStart": "zero", "panelEnd": "accordion-padding",
        "indicatorSize": "accordion-indicator", "indicatorMarkSize": "accordion-indicator-mark", "indicatorStroke": "line-width",
        "indicatorColor": "color.text-muted", "disabledOpacity": "disabled-opacity",
    }),
    rule("accordion-trigger", "outline", {
        "fontSize": "font.ui.size", "lineHeight": "font.ui.line-height", "weight": "medium-weight",
        "radius": "zero", "gap": "accordion-gap", "blockPadding": "accordion-padding", "disabledOpacity": "disabled-opacity",
    }),
    rule("enclosed-accordion", "enclosed", {"radius": "control-radius", "borderWidth": "line-width", "borderColor": "color.line"}),
    rule("enclosed-accordion-item", "enclosed", {
        "radius": "accordion-inner-radius", "inlinePadding": "accordion-padding", "blockPadding": "accordion-padding",
        "borderWidth": "line-width", "borderColor": "color.line", "openBackground": "accordion-open-background", "disabledOpacity": "disabled-opacity",
    }),
]


def source_values(mode, branch):
    # Input/50 already encodes the chosen source Neutral branch; scale its alpha
    # to input/90 for choices without replacing it with a precomposed swatch.
    input_color = copy.deepcopy(branch["source"]["component"]["input"]["background"]["$value"])
    input_color["alpha"] = input_color.get("alpha", 1) * 1.8
    selected = color([1, 1, 1], .045) if mode == "dark" else alias("color", "color.canvas")
    return {
        "zero": dim(0), "line-width": dim(1), "transparent": color([0, 0, 0], 0),
        "regular-weight": typed("fontWeight", 400), "medium-weight": typed("fontWeight", 500),
        "disabled-opacity": typed("number", .5), "small-text": dim(.75, "rem"), "small-line-height": typed("number", 4 / 3),
        "choice-background": typed("color", input_color), "choice-gap": dim(8), "radio-dot": dim(10 if mode == "dark" else 8),
        "switch-thumb": alias("color", "color.text" if mode == "dark" else "color.canvas"),
        "switch-inset": dim(2), "switch-border-width": dim(2),
        "thumb-shadow": typed("shadow", copy.deepcopy(branch["pins"]["component.card.shadow"])),
        "tooltip-radius": dim(.875, "rem"), "tooltip-maximum": dim(20, "rem"), "tooltip-inline": dim(.75, "rem"), "tooltip-block": dim(.375, "rem"),
        "dialog-padding": dim(1.5, "rem"), "dialog-gap": dim(1.5, "rem"), "dialog-footer-gap": dim(.5, "rem"), "dialog-backdrop-blur": dim(8), "dialog-radius-cap": dim(24), "dialog-fill-breakpoint": dim(40, "rem"),
        "overlay-title-size": dim(1, "rem"), "dialog-title-line": typed("number", 1), "popover-title-line": typed("number", 1.5),
        "popover-padding": dim(1, "rem"), "popover-gap": dim(1, "rem"), "popover-radius": dim(1.375, "rem"),
        "control-radius": dim(18), "tabs-inset": dim(3), "tabs-vertical-inset": dim(4), "tabs-content-gap": dim(8),
        "tab-inline": dim(6), "tab-block": dim(2), "tab-minimum": dim(26),
        "tab-rest-color": alias("color", "color.text-muted") if mode == "dark" else color([10 / 255] * 3, .6),
        "tab-selected-background": selected,
        "card-spacing": dim(20), "card-small-spacing": dim(16), "card-radius-cap": dim(24), "card-title-size": dim(1, "rem"), "card-title-line-height": typed("number", 1.5), "card-header-gap": dim(6),
        "badge-minimum": dim(20), "badge-inline": dim(8), "badge-gap": dim(4),
        # Deliberate protected-target adaptation: source chip21px; local24px.
        "chip-inline": dim(6), "chip-gap": dim(4), "chip-minimum": dim(24),
        "keycap-radius": dim(.625, "rem"), "keycap-minimum": dim(1.25, "rem"), "keycap-inline": dim(.25, "rem"),
        "accordion-padding": dim(16), "accordion-gap": dim(24), "accordion-indicator": dim(16), "accordion-indicator-mark": dim(5), "accordion-inner-radius": dim(17),
        "accordion-open-background": color([38 / 255 if mode == "dark" else 245 / 255] * 3, .5),
    }


def proposal(definitions):
    result = copy.deepcopy(definitions)
    theme = next(item for item in result if item.get("id") == "shadcn-inspired")
    for mode in ("light", "dark"):
        branch = theme["baseOptions"][mode]
        branch["source"].setdefault("theme", {})["shadcn-shape"] = source_values(mode, branch)
        # Keep the semantic radius within the managed recipe vocabulary. The
        # finite maxRadius presentation supplies source min(radius-4xl, 24px)
        # on ordinary dialogs; public overrides and responsive geometry win.
        branch["pins"]["radius.dialog"] = "{radius.container}"
        # Existing typed state hooks are authoritative in the renderer; update
        # their baseline together with the new structural presentation.
        branch["pins"]["component.tab.selected-background"] = "{theme.shadcn-shape.tab-selected-background}"
        branch["pins"]["component.tab.hover-background"] = "{theme.shadcn-shape.transparent}"
        # Rhea does not add an independent pressed fill. Let the structural
        # presentation preserve resting/selected paint, with explicit local
        # pressed hooks still available to a consumer.
        branch["pins"].pop("component.tab.pressed-background", None)
        branch["pins"].pop("component.tab.pressed-color", None)
        branch["pins"].pop("component.accordion.pressed-background", None)
        branch["pins"].pop("component.accordion.pressed-color", None)
    managed = {entry["target"] for entry in RULES} | {"switch"}  # Remove the superseded provisional solid mapping.
    replacements = {entry["target"]: entry for entry in RULES}
    mapped = []
    replaced = set()
    for entry in theme["companion"]["rules"]:
        target = entry["target"]
        if target not in managed:
            mapped.append(entry)
        elif target in replacements and target not in replaced:
            # Preserve source order relative to independent slider/alert rules.
            mapped.append(copy.deepcopy(replacements[target]))
            replaced.add(target)
    mapped.extend(copy.deepcopy(entry) for entry in RULES if entry["target"] not in replaced)
    theme["companion"]["rules"] = mapped
    assert [item for item in definitions if item.get("id") != "shadcn-inspired"] == [item for item in result if item.get("id") != "shadcn-inspired"]
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[2])
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    path = args.root / "tooling/theme-candidates/definitions.json"
    original = path.read_text()
    result = proposal(json.loads(original))
    print(json.dumps({"mode": "apply" if args.apply else "preview", "path": str(path), "targets": [item["target"] for item in RULES], "changed": result != json.loads(original)}, indent=2))
    if args.apply:
        authoring = (args.root / "packages/tokens/src/authoring.ts").read_text()
        if "sourceShapeTargets" not in authoring or "sourceShapePresentations" not in authoring:
            raise RuntimeError("Parent must integrate/register the typed companion source-shapes module first")
        if "astryxTargets" not in authoring or "astryxPresentations" not in authoring:
            raise RuntimeError("Parent must integrate/register the shared stateful-switch module first")
        if path.read_text() != original:
            raise RuntimeError("Definitions changed during preparation; retry after coordination")
        path.write_text(json.dumps(result, indent=2, ensure_ascii=True) + "\n")


if __name__ == "__main__":
    main()
