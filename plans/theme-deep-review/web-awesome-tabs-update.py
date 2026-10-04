#!/usr/bin/env python3
"""Select pinned Web Awesome 3.13.0 default tab rail/indicator/panel anatomy.

Import update(definition) after web-awesome-update.py; no direct execution,
filesystem writes, builds, metadata regeneration or browser acquisition.
"""
from __future__ import annotations


def dimension(value: float) -> dict:
    return {"$type": "dimension", "$value": {"value": value, "unit": "rem"}}


def color(hex_value: str) -> dict:
    return {"$type": "color", "$value": {"colorSpace": "srgb", "components": [int(hex_value[index:index + 2], 16) / 255 for index in (1, 3, 5)]}}


def update(definition: dict) -> None:
    """Idempotent and confined to this theme's tab source tokens/recipes/pins."""
    if definition.get("id") != "web-awesome-inspired" or definition.get("reference", {}).get("version") != "3.13.0":
        raise ValueError("Expected the canonical Web Awesome 3.13.0 definition.")
    prefix = "theme.web-awesome-tabs."
    for mode in ("light", "dark"):
        options = definition["baseOptions"][mode]
        options.setdefault("source", {}).setdefault("theme", {}).setdefault("web-awesome-tabs", {}).update({
            "gap": dimension(0),
            "track-width": dimension(0.125),
            "track-color": color("#e4e5e9" if mode == "light" else "#2f323f"),
            "indicator-color": color("#0071ec"),
            "selected-color": color("#0053c0" if mode == "light" else "#3e96ff"),
            "panel-padding": dimension(2),
        })
        # Public component overrides would otherwise mask the source roles.
        # Enabled selected ink uses on-quiet; the indicator uses fill-loud.
        pins = options.setdefault("pins", {})
        pins["component.tab.indicator-color"] = "{" + prefix + "indicator-color}"
        pins["component.tab.selected-color"] = "{" + prefix + "selected-color}"
        # Source hover retains currentColor. Unpin the old shared action-ink
        # override so the finite renderer keeps each rest/selected source ink;
        # consumer --en-tab-hover-color still wins when explicitly supplied.
        pins.pop("component.tab.hover-color", None)

    rules = definition["companion"]["rules"]
    def merge(target: str, roles: dict) -> None:
        for current in rules:
            if current["target"] == target and current.get("variant") is None:
                current["presentation"] = "line"
                current.setdefault("roles", {}).update(roles)
                return
        rules.append({"target": target, "presentation": "line", "tokens": {}, "roles": roles})

    merge("tabs", {"gap": prefix + "gap", "trackWidth": prefix + "track-width", "trackColor": prefix + "track-color"})
    merge("tab-list", {"gap": prefix + "gap", "trackWidth": prefix + "track-width", "trackColor": prefix + "track-color"})
    merge("tab", {"indicatorWidth": prefix + "track-width", "trackWidth": prefix + "track-width", "indicatorColor": prefix + "indicator-color", "selectedColor": prefix + "selected-color"})
    merge("vertical-tab", {"indicatorWidth": prefix + "track-width", "trackWidth": prefix + "track-width", "indicatorColor": prefix + "indicator-color"})
    merge("tab-panel", {"padding": prefix + "panel-padding", "paddingEnd": prefix + "panel-padding", "inlinePadding": prefix + "gap"})
    merge("vertical-tab-panel", {"padding": prefix + "panel-padding", "paddingEnd": prefix + "panel-padding"})
    definition["reference"]["tabsReview"] = {
        "date": "2026-10-03", "sourceVersion": "3.13.0",
        "report": "plans/theme-deep-review/web-awesome-tabs.md",
        "profile": "Default theme, Default palette, blue brand; top/vertical-start rail anatomy",
        "changes": ["zero gap and 0.125rem neutral-fill-normal rail", "brand-fill-loud active-tab border #0071ec in both appearances", "enabled active label matches source on-quiet #0053c0 light / #3e96ff dark through the role and public component pin", "matching negative rail overlap and bilateral 2rem panel padding"],
        "adaptations": [
            "Local target floors, immediate focus, native/custom selection and cancellation semantics remain authoritative.",
            "Existing authored selected-disabled and hover contracts remain authoritative.",
            "Existing tab insets map source 1em/1.5em at its default 16px size using rem roles; other local size profiles remain an adaptation.",
            "The source renders each active tab border; its unused indicator CSS is not evidence of a separately animated indicator.",
            "Vertical panel padding and logical rail are mapped; source placement variants, side-by-side vertical group layout and overflow scroll controls remain outside this focused theme change.",
        ],
        "verification": "Qualification evidence is recorded in plans/theme-deep-review/verification-20261003.json; source mapping and limits are recorded in plans/theme-deep-review/web-awesome-tabs.md.",
    }
