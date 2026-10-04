#!/usr/bin/env python3
"""Reviewable Spectrum-only recipe proposal; writes only with --apply.

Sources: @react-spectrum/s2 1.7.1, commit
4dd44e0f400636a87a9ad4390903e78c5ae6113c, installed upstream src/Field.tsx,
src/style-utils.ts, src/Switch.tsx, src/Tabs.tsx, style/spectrum-theme.ts.
See spectrum.md for source URLs, adaptations and required rendered checks.

Default proposal uses currently available typed tokens and the tab companion.
--with-companion-typography additionally consumes the incoming shared companion
engine's existing button/compact and text-control/outline line-height roles.
That option must wait for the engine integration; it does not modify the engine.
No other theme, artifact, generated file, historical receipt or source changes.
"""
from __future__ import annotations

import argparse
from copy import deepcopy
import json
from pathlib import Path


def dimension(value: float, unit: str = "px") -> dict:
    return {"value": value, "unit": unit}


def upsert_rule(rules: list[dict], rule: dict) -> None:
    key = tuple(rule.get(name) for name in ("target", "variant", "presentation"))
    for existing in rules:
        if tuple(existing.get(name) for name in ("target", "variant", "presentation")) == key:
            existing.setdefault("tokens", {}).update(rule.get("tokens", {}))
            if "roles" in rule:
                existing.setdefault("roles", {}).update(rule["roles"])
            return
    rules.append(rule)


def propose(definitions: list[dict], companion_typography: bool) -> list[dict]:
    result = deepcopy(definitions)
    spectrum = next(item for item in result if item["id"] == "spectrum-inspired")
    for mode in ("light", "dark"):
        baseline = spectrum["baseOptions"][mode]
        pins = baseline["pins"]
        # Source-sized presentation supplies the fallback; keep local public overrides live.
        pins.pop("component.choice.size", None)
        pins.update({
            # Narrow field-only stroke; protected targets and action borders stay intact.
            "component.input.border-width": dimension(2),
            "component.input.invalid-border-width": dimension(2),
            # S2 Field has no brand-blue hover frame; keep our accessible boundary.
            "component.input.hover-border-color": "{component.input.border-color}",
            # M resting switch silhouette. Checked growth, border width and paint
            # are a separate anatomy pass, not claimed fixed by these dimensions.
            "size.switch-inline": dimension(26 / 16, "rem"),
            "size.switch-block": dimension(16 / 16, "rem"),
            "size.switch-thumb": dimension(8 / 16, "rem"),
            "space.switch-inset": dimension(3 / 16, "rem"),
        })
        # The source rounds desktop text sizes to whole pixels. Pin exact output
        # values instead of the generic .9375/1.125 text-scale recipe.
        for size, font_px, track_height, thumb_px in (
            ("small", 12, 14, 6),
            ("medium", 14, 16, 8),
            ("large", 16, 18, 10),
        ):
            pins[f"font.ui.size-{size}"] = dimension(font_px / 16, "rem")
            pins[f"font.input.size-{size}"] = dimension(font_px / 16, "rem")
            # S2 Switch width is fontRelative(26), not a generic geometry scale.
            pins[f"size.switch-inline-{size}"] = dimension((26 / 14) * font_px / 16, "rem")
            pins[f"size.switch-block-{size}"] = dimension(track_height / 16, "rem")
            pins[f"size.switch-thumb-{size}"] = dimension(thumb_px / 16, "rem")
            # Existing 1px frame + 3px inset centers the off thumb at normal rem.
            # Revisit with a source-like 2px frame/checked-thumb presentation.
            pins[f"space.switch-inset-{size}"] = dimension(3 / 16, "rem")
        if companion_typography:
            theme = baseline.setdefault("source", {}).setdefault("theme", {})
            control = theme.setdefault("spectrum", {}).setdefault("control", {})
            for size, ratio in (("small", 16 / 12), ("medium", 18 / 14), ("large", 20 / 16)):
                control[f"line-height-{size}"] = {"$type": "number", "$value": ratio}
    rules = spectrum["companion"]["rules"]
    upsert_rule(rules, {
        "target": "tab",
        "tokens": {"--en-font-label-strong-weight": "font.ui.weight"},
    })
    if companion_typography:
        roles = {f"line-height-{size}": f"theme.spectrum.control.line-height-{size}"
                 for size in ("small", "medium", "large")}
        upsert_rule(rules, {"target": "button", "presentation": "compact", "tokens": {}, "roles": roles})
        upsert_rule(rules, {"target": "text-control", "presentation": "outline", "tokens": {}, "roles": roles})
    assert [item for item in result if item["id"] != "spectrum-inspired"] == [
        item for item in definitions if item["id"] != "spectrum-inspired"
    ], "Unexpected non-Spectrum change"
    old_spectrum = next(item for item in definitions if item["id"] == "spectrum-inspired")
    for key in set(spectrum) | set(old_spectrum):
        if key not in {"baseOptions", "companion"}:
            assert spectrum.get(key) == old_spectrum.get(key), f"Unexpected definition change: {key}"
    return result


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[2])
    parser.add_argument("--with-companion-typography", action="store_true")
    parser.add_argument("--apply", action="store_true", help="Write after proposal review; default only describes the proposal")
    args = parser.parse_args()
    root = args.root.resolve()
    path = root / "tooling/theme-candidates/definitions.json"
    definitions = json.loads(path.read_text())
    if args.with_companion_typography:
        controls = root / "packages/tokens/src/companion/controls.ts"
        if not controls.exists() or "lineHeightRoles" not in controls.read_text():
            raise SystemExit("Shared companion typography engine is not integrated; omit the option or integrate it first.")
    proposed = propose(definitions, args.with_companion_typography)
    changed = definitions != proposed
    if args.apply and changed:
        path.write_text(json.dumps(proposed, indent=2, ensure_ascii=False) + "\n")
    print(json.dumps({
        "mode": "applied" if args.apply else "proposal only",
        "changed": changed,
        "file": str(path),
        "theme": "spectrum-inspired",
        "appearances": ["light", "dark"],
        "updates": ["2px field frame", "neutral field hover", "16px medium choice", "source-sized resting switch", "12/14/16px UI and input sizes", "normal selected-tab weight"],
        "companionSizeLineHeights": args.with_companion_typography,
        "remaining": ["checked switch growth and 2px border", "radio thick-ring anatomy", "neutral/emphasized choices", "size=inherit line-height support", "coarse platform typography"],
    }, indent=2))


if __name__ == "__main__":
    main()
