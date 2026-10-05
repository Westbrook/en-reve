#!/usr/bin/env python3
"""Add Fluent anatomy recipes only after fluent.ts is registered and reviewed.

This script changes only Fluent's baseOptions/companion. It does not install the
engine, regenerate artifacts, or change any other theme. Default is dry-run.
"""
from __future__ import annotations

import argparse
import copy
import json
from pathlib import Path


def color(value):
    return {"colorSpace": "srgb", "components": [int(value[n:n + 2], 16) / 255 for n in (1, 3, 5)]}


def token(type_, value):
    return {"$type": type_, "$value": value}


def upsert(rules, rule):
    existing = next((r for r in rules if r["target"] == rule["target"] and r.get("presentation") == rule.get("presentation")), None)
    if existing is None:
        rules.append(rule)
    else:
        for key in ("tokens", "roles"):
            existing.setdefault(key, {}).update(rule[key])


def update(definition):
    # Neutral anatomy is exact pinned Fluent token data. Rose compound-brand
    # assignments use the established website palette; state assignment itself
    # is an adaptation of product Fluent's independent compound-brand roles.
    # Dark hover takes the pale rose palette value, preserving contrast and the
    # product dark theme's lighter-hover / darker-held progression.
    palettes = {
        "light": {"perimeter": "#d1d1d1", "perimeter-hover": "#c7c7c7", "accessible": "#616161", "accessible-hover": "#575757", "accessible-pressed": "#4d4d4d", "thumb": "#616161", "thumb-hover": "#424242", "thumb-pressed": "#424242", "selected-hover": "#954355", "selected-pressed": "#682f3d", "disabled-background": "#f0f0f0", "disabled-border": "#e0e0e0", "disabled-mark": "#bdbdbd"},
        "dark": {"perimeter": "#666666", "perimeter-hover": "#757575", "accessible": "#adadad", "accessible-hover": "#bdbdbd", "accessible-pressed": "#b3b3b3", "thumb": "#adadad", "thumb-hover": "#d6d6d6", "thumb-pressed": "#d6d6d6", "selected-hover": "#fad6dc", "selected-pressed": "#db7488", "disabled-background": "#141414", "disabled-border": "#424242", "disabled-mark": "#5c5c5c"},
    }
    for mode, colors in palettes.items():
        theme = definition["baseOptions"][mode].setdefault("source", {}).setdefault("theme", {})
        values = theme.setdefault("fluent-anatomy", {})
        values.update({name: token("color", color(value)) for name, value in colors.items()})
        values["transparent"] = token("color", {"colorSpace": "srgb", "components": [0, 0, 0], "alpha": 0})
        values["mixed-size"] = token("dimension", {"value": 8, "unit": "px"})
        values["helper-size"] = token("dimension", {"value": 12, "unit": "px"})
        values["helper-line-height"] = token("number", 16 / 12)
        values["normal-weight"] = token("fontWeight", 400)
        # Inherited field hooks cross component shadow roots, preserving the
        # source perimeter and independent bottom edge on unforwarded children.
        definition["baseOptions"][mode].setdefault("pins", {}).update({
            "component.input.border-color": "{theme.fluent-anatomy.perimeter}",
            "component.input.hover-border-color": "{theme.fluent-anatomy.perimeter-hover}",
            "component.input.bottom-border-color": "{theme.fluent-anatomy.accessible}",
            "component.input.hover-bottom-border-color": "{theme.fluent-anatomy.accessible-hover}",
        })
    rules = definition["companion"]["rules"]
    prefix = "theme.fluent-anatomy."
    # Core consumers own inherited edges, including nested and adorned fields.
    # Retain the reusable presentation registry; retire only these bundled rules.
    rules[:] = [rule for rule in rules if not (
        rule["target"] in ("fluent-field", "fluent-number-field")
        and rule.get("presentation") == "bottom-edge"
    )]
    choice = {
        "border": prefix + "accessible", "hover-border": prefix + "accessible-hover", "pressed-border": prefix + "accessible-pressed",
        "selected-background": "color.action-text", "selected-hover-background": prefix + "selected-hover", "selected-pressed-background": prefix + "selected-pressed",
        "selected-color": "color.on-action", "disabled-background": prefix + "disabled-background", "disabled-border": prefix + "disabled-border", "disabled-mark": prefix + "disabled-mark",
    }
    upsert(rules, {"target": "fluent-checkbox", "presentation": "mixed-square", "tokens": {}, "roles": {**choice, "background": "color.surface", "mixed-size": prefix + "mixed-size"}})
    upsert(rules, {"target": "fluent-switch", "presentation": "stateful-track", "tokens": {}, "roles": {**choice, "background": prefix + "transparent", "thumb": prefix + "thumb", "thumb-hover": prefix + "thumb-hover", "thumb-pressed": prefix + "thumb-pressed"}})
    upsert(rules, {"target": "fluent-native-field", "presentation": "field-text", "tokens": {}, "roles": {
        "labelWeight": prefix + "normal-weight", "helperSize": prefix + "helper-size",
        "helperLineHeight": prefix + "helper-line-height", "helperWeight": prefix + "normal-weight",
    }})


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[2])
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    root = args.root.resolve()
    authoring = (root / "packages/tokens/src/authoring.ts").read_text()
    if "fluentTargets" not in authoring or "fluentPresentations" not in authoring:
        parser.error("Register the reviewed Fluent companion module before applying its recipes.")
    path = root / "tooling/theme-candidates/definitions.json"
    before = json.loads(path.read_text())
    after = copy.deepcopy(before)
    matches = [definition for definition in after if definition["id"] == "fluent-inspired"]
    if len(matches) != 1:
        raise SystemExit("Expected one Fluent theme; no files changed")
    update(matches[0])
    for old, new in zip(before, after):
        if old["id"] != "fluent-inspired" and old != new:
            raise AssertionError("Refusing to modify another theme")
    changed = before != after
    if args.apply and changed:
        path.write_text(json.dumps(after, indent=2, ensure_ascii=False) + "\n")
    print(json.dumps({"file": str(path), "changed": changed, "applied": args.apply and changed}, indent=2))


if __name__ == "__main__":
    main()
