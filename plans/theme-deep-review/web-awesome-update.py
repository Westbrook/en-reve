#!/usr/bin/env python3
"""Prepare the narrow Web Awesome 3.13.0 fidelity refinements after API integration.

Default is a JSON preview. Pass --apply to write only the Web Awesome definition.
Requires the registered component-presentation layer; does not build or regenerate.
"""
from __future__ import annotations

import argparse
import copy
import json
from pathlib import Path


def update(definition: dict) -> None:
    for mode in ("light", "dark"):
        source = definition["baseOptions"][mode].setdefault("source", {})
        fidelity = source.setdefault("theme", {}).setdefault("fidelity", {})
        # 3.13.0 textarea: .75em - (1.6em - 1em) / 2 = .45em.
        # The finite relative role follows actual editor text and inherited sizes.
        fidelity.pop("textarea-block-padding", None)
        fidelity["textarea-block-padding-em"] = {"$type": "number", "$value": 0.45}
        fidelity["disabled-opacity"] = {"$type": "number", "$value": 0.5}

    rules = definition["companion"]["rules"]

    def put(rule: dict) -> None:
        # Leave unrelated variants and existing action/choice typography intact.
        for index, current in enumerate(rules):
            if current["target"] == rule["target"] and current.get("variant") == rule.get("variant"):
                rules[index] = rule
                return
        rules.append(rule)

    put({
        "target": "textarea",
        "presentation": "compact",
        "tokens": {"--en-font-input-line-height": "font.body.line-height"},
        "roles": {"block-padding-em": "theme.fidelity.textarea-block-padding-em"},
    })
    put({
        "target": "tab",
        "presentation": "line",
        "tokens": {
            "--en-font-ui-weight": "font.label-strong.weight",
            "--en-font-ui-line-height": "font.body.line-height",
        },
        # Source tab uses 1em/1.5em at the normal 16px size. Existing absolute
        # spacing inputs preserve rem zoom; source em scaling remains a limit.
        "roles": {
            "inlinePadding": "space.6",
            "blockPadding": "space.4",
            "restColor": "color.text-muted",
            "selectedColor": "color.action-text",
            "indicatorColor": "color.action-text",
        },
    })
    put({
        "target": "switch",
        "presentation": "solid",
        "tokens": {},
        "roles": {
            "background": "color.surface",
            "thumb-background": "component.input.border-color",
            "selected-background": "color.action",
            "selected-color": "color.surface",
            "disabled-opacity": "theme.fidelity.disabled-opacity",
        },
    })
    definition["reference"]["deepReview"] = {
        "date": "2026-10-03",
        "report": "plans/theme-deep-review/shared-and-additional.md",
        "sourceVersion": "3.13.0",
        "changes": ["multiline leading and block padding", "tab spacing", "switch off/checked paint"],
        "adaptations": [
            "Textarea inset follows the source .45em relationship; local size outputs remain En Reve's size adaptation. Tab rem insets map the source at its default 16px size.",
            "Off-switch thumb follows the existing stronger input boundary adaptation; source selected thumb uses the default surface in both appearances.",
            "En Reve target floors, immediate focus, input semantics and reduced-motion behavior remain authoritative.",
        ],
        "verification": "pending coordinated catalogue and rendered checks",
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[2])
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    path = args.root / "tooling/theme-candidates/definitions.json"
    definitions = json.loads(path.read_text())
    matches = [item for item in definitions if item["id"] == "web-awesome-inspired"]
    if len(matches) != 1 or matches[0]["reference"]["version"] != "3.13.0":
        raise SystemExit("Expected exactly one canonical Web Awesome 3.13.0 definition.")
    before = copy.deepcopy(definitions)
    update(matches[0])
    changed = [new["id"] for old, new in zip(before, definitions) if old != new]
    if any(name != "web-awesome-inspired" for name in changed):
        raise SystemExit("Refusing an unrelated definition change.")
    if not args.apply:
        print(json.dumps({"changed": changed, "definition": matches[0]}, indent=2))
        return
    controls = args.root / "packages/tokens/src/companion/controls.ts"
    navigation = args.root / "packages/tokens/src/companion/navigation.ts"
    if not controls.exists() or not navigation.exists():
        raise SystemExit("Integrate the registered typed component-presentation layer first.")
    if changed:
        temporary = path.with_name(path.name + ".web-awesome-review.tmp")
        temporary.write_text(json.dumps(definitions, indent=2, ensure_ascii=False) + "\n")
        temporary.replace(path)
    print(json.dumps({"changed": changed, "verification": "not run"}))


if __name__ == "__main__":
    main()
