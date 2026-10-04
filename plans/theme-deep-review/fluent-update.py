#!/usr/bin/env python3
"""Prepare only Fluent recipe corrections; run with --apply after review.

--with-presentations additionally uses the shared typed companion engine. It
must be integrated first; this script never copies or modifies that engine.
"""
from __future__ import annotations

import argparse
import copy
import json
from pathlib import Path


def dim(value, unit="px"):
    return {"value": value, "unit": unit}


def token(type_, value):
    return {"$type": type_, "$value": value}


def upsert_rule(rules, rule):
    key = (rule["target"], rule.get("variant"), rule.get("presentation"))
    existing = next((r for r in rules if (r["target"], r.get("variant"), r.get("presentation")) == key), None)
    if existing is None:
        rules.append(rule)
    else:
        for field in ("tokens", "roles"):
            if field in rule:
                existing.setdefault(field, {}).update(rule[field])


def update(definition, presentations=False):
    rules = definition["companion"]["rules"]
    for target in ("choice", "field"):
        upsert_rule(rules, {"target": target, "tokens": {"--en-font-label-strong-weight": "font.ui.weight"}})
    for mode in ("light", "dark"):
        base = definition["baseOptions"][mode]
        pins = base["pins"]
        # Fixed 40 x 20 / 14 family silhouette needs fixed insets at every size.
        for suffix in ("", "-small", "-medium", "-large"):
            pins[f"space.switch-inset{suffix}"] = dim(2)
        # WC switch translates its thumb with durationNormal (200ms).
        pins["component.switch.press-duration"] = dim(200, "ms")
        pins["component.switch.release-duration"] = dim(200, "ms")
        # Website identity remains rose selection/neutral CTA. These independent
        # roles now agree with the recorded website hover and adopted underline.
        pins["component.navigation.hover-background"] = "{component.option.hover-background}"
        pins["component.navigation.hover-color"] = "{component.option.hover-color}"
        pins["component.tab.indicator-color"] = "{color.action-text}"
        if not presentations:
            continue
        theme = base.setdefault("source", {}).setdefault("theme", {})
        controls = theme.setdefault("fluent-controls", {})
        controls.update({
            "caption-size": token("dimension", dim(12)),
            "caption-line-height": token("number", 16 / 12),
            "normal-weight": token("fontWeight", 400),
            "enabled-opacity": token("number", 1),
        })
        # Component typography/section spacing, distinct from website editorial
        # heading/panel roles. Section allocation is an En Reve composition of
        # Fluent's 24px outer inset and source header/body/footer hierarchy.
        dialog = theme.setdefault("fluent-dialog", {})
        dialog.update({
            "font-size": token("dimension", dim(14)),
            "line-height": token("number", 20 / 14),
            "title-size": token("dimension", dim(20)),
            "title-line-height": token("number", 28 / 20),
            "strong-weight": token("fontWeight", 600),
            "inline-size": token("dimension", dim(600)),
            "padding": token("dimension", dim(24)),
            "section-gap": token("dimension", dim(8)),
            "zero": token("dimension", dim(0)),
            # The shared motion consumer clamps scale to .95. This is explicitly
            # a bounded approximation of WC .85, never claimed exact parity.
            "surface-scale": token("number", .95),
        })
    if presentations:
        upsert_rule(rules, {
            "target": "form-field", "presentation": "compact",
            "tokens": {"--en-font-label-strong-weight": "font.ui.weight"},
            "roles": {
                "disabled-opacity": "theme.fluent-controls.enabled-opacity",
                "helper-size": "theme.fluent-controls.caption-size",
                "helper-line-height": "theme.fluent-controls.caption-line-height",
                "helper-weight": "theme.fluent-controls.normal-weight",
                "error-size": "theme.fluent-controls.caption-size",
                "error-line-height": "theme.fluent-controls.caption-line-height",
                "error-weight": "theme.fluent-controls.normal-weight",
            },
        })
        upsert_rule(rules, {
            "target": "dialog", "presentation": "sectioned", "tokens": {},
            "roles": {
                "fontSize": "theme.fluent-dialog.font-size",
                "lineHeight": "theme.fluent-dialog.line-height",
                "fontWeight": "theme.fluent-controls.normal-weight",
                "inlineSize": "theme.fluent-dialog.inline-size",
                "sectionInlinePadding": "theme.fluent-dialog.padding",
                "headerBlockStartPadding": "theme.fluent-dialog.padding",
                "headerBlockEndPadding": "theme.fluent-dialog.section-gap",
                "headerGap": "theme.fluent-dialog.section-gap",
                "bodyBlockStartPadding": "theme.fluent-dialog.zero",
                "bodyBlockEndPadding": "theme.fluent-dialog.padding",
                "footerBlockStartPadding": "theme.fluent-dialog.zero",
                "footerBlockEndPadding": "theme.fluent-dialog.padding",
                "footerGap": "theme.fluent-dialog.section-gap",
                "titleFontSize": "theme.fluent-dialog.title-size",
                "titleLineHeight": "theme.fluent-dialog.title-line-height",
                "titleFontWeight": "theme.fluent-dialog.strong-weight",
                "surfaceScale": "theme.fluent-dialog.surface-scale",
                "surfaceOffset": "theme.fluent-dialog.zero",
            },
        })


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[2])
    parser.add_argument("--apply", action="store_true")
    parser.add_argument("--with-presentations", action="store_true")
    args = parser.parse_args()
    root = args.root.resolve()
    path = root / "tooling/theme-candidates/definitions.json"
    if args.with_presentations:
        for file in ("controls.ts", "display.ts"):
            if not (root / "packages/tokens/src/companion" / file).exists():
                parser.error("Integrate the shared typed companion presentation engine first.")
    before = json.loads(path.read_text())
    after = copy.deepcopy(before)
    matches = [d for d in after if d["id"] == "fluent-inspired"]
    if len(matches) != 1:
        raise SystemExit("Expected exactly one Fluent definition; no files changed.")
    update(matches[0], presentations=args.with_presentations)
    for old, new in zip(before, after):
        if old["id"] != "fluent-inspired" and old != new:
            raise AssertionError("Refusing to change another theme")
    changed = before != after
    if args.apply and changed:
        path.write_text(json.dumps(after, indent=2, ensure_ascii=False) + "\n")
    print(json.dumps({"changed": changed, "applied": args.apply and changed,
                      "presentations": args.with_presentations, "file": str(path)}, indent=2))


if __name__ == "__main__":
    main()
