"""Idempotent Astryx default presentation follow-up; importing never writes files.

The coordinator calls update(definition) during its serial recipe application.
This preserves every other theme, variant, role and existing companion rule.
"""
from __future__ import annotations


def color(value: str) -> dict:
    return {"colorSpace": "srgb", "components": [int(value[i:i + 2], 16) / 255 for i in (0, 2, 4)]}


def update(definition: dict) -> None:
    if definition.get("id") != "astryx-inspired":
        raise ValueError("Expected only the Astryx definition")
    for appearance in ("light", "dark"):
        source = definition["baseOptions"][appearance]["source"]
        source["theme"]["button"]["danger"]["focus-color"] = {
            "$type": "color", "$value": color("E3193B" if appearance == "light" else "F5394F")}
        source["theme"].setdefault("astryx", {}).setdefault("card", {})["padding-inset"] = {
            "$type": "dimension", "$value": {"value": 16, "unit": "px"}}
    rules = definition["companion"]["rules"]
    danger = next(rule for rule in rules if rule["target"] == "button" and rule.get("variant") == "danger")
    if danger.get("presentation") not in (None, "compact"):
        raise ValueError("Preserve the existing danger presentation before combining defaults")
    danger["presentation"] = "compact"
    danger.setdefault("roles", {})["focus-color"] = "theme.button.danger.focus-color"
    cards = [rule for rule in rules if rule["target"] == "inset-card"]
    if cards:
        if len(cards) != 1 or cards[0].get("presentation") != "inset":
            raise ValueError("Expected one compatible card presentation")
        card = cards[0]
    else:
        card = {"target": "inset-card", "presentation": "inset", "tokens": {}, "roles": {}}
        rules.append(card)
    card.setdefault("roles", {})["paddingInset"] = "theme.astryx.card.padding-inset"
