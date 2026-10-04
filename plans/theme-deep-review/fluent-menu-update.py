#!/usr/bin/env python3
"""Select the pinned Fluent React default MenuPopover intrinsic-width bounds.

Coordinator imports update(definition); no direct execution or filesystem writes.
Requires the optional public ordinary-menu width hooks in commands.ts.
"""
from __future__ import annotations


def update(definition: dict) -> None:
    """Idempotently pin only Fluent ordinary-menu source widths."""
    if definition.get("id") != "fluent-inspired":
        raise ValueError("Expected the Fluent-inspired definition.")
    for mode in ("light", "dark"):
        pins = definition["baseOptions"][mode].setdefault("pins", {})
        pins["component.menu.min-inline-size"] = {"value": 138, "unit": "px"}
        pins["component.menu.max-inline-size"] = {"value": 300, "unit": "px"}
    definition["reference"]["menuWidthReview"] = {
        "date": "2026-10-03", "report": "plans/theme-deep-review/fluent-menu.md",
        "sourceVersion": "@fluentui/react-menu 9.25.4 via @fluentui/react-components 9.74.7",
        "changes": ["ordinary-menu min138px/max300px with intrinsic max-content width in both appearances"],
        "adaptations": [
            "En Reve measured visual-viewport fitting may lower the minimum; source width values remain literal CSS pixels.",
            "Public overlay maximum overrides the theme's menu maximum fallback, and replacement submenus retain their parent-width lifecycle.",
            "Comboboxes and command palettes keep their independent geometry; this profile applies only to native/custom command-menu surfaces.",
        ],
        "verification": "Qualification evidence is recorded in plans/theme-deep-review/verification-20261003.json; source mapping and limits are recorded in plans/theme-deep-review/fluent-menu.md.",
    }
