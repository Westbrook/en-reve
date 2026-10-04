#!/usr/bin/env python3
"""Reviewed-data proposal; default is read-only. Parent reviews before --apply.

Only shadcn-inspired is modified. No builds, regeneration, or source acquisition.
The companion-anatomy mapping is a separate step after shared-engine integration.
"""

import argparse
import copy
import json
from pathlib import Path


def proposal(definitions):
    result = copy.deepcopy(definitions)
    matches = [item for item in result if item.get("id") == "shadcn-inspired"]
    if len(matches) != 1:
        raise ValueError("Expected exactly one shadcn-inspired definition")
    theme = matches[0]
    changes = []
    for mode in ("light", "dark"):
        branch = theme["baseOptions"][mode]
        for phase in ("enter", "exit"):
            key = f"component.dialog.{phase}-duration"
            previous = branch["pins"].get(key)
            expected = {"value": 100, "unit": "ms"}
            if previous != expected:
                branch["pins"][key] = expected
                changes.append(f"{mode}: {key}: {previous!r} -> 100ms")

        # Source badge has a20px visual silhouette. Preserve multiline growth:
        # 16px line box +1px padding per edge +1px border per edge =20px.
        # Source's fixed h-5 can absorb its own py-0.5; our natural-height
        # component requires this explicit adaptation instead of a fixed height.
        spacing = branch["source"].setdefault("space", {})
        for key, value in (("badge-block", 1), ("badge-inline", 8)):
            expected = {"$type": "dimension", "$value": {"value": value, "unit": "px"}}
            if spacing.get(key) != expected:
                spacing[key] = expected
                changes.append(f"{mode}: space.{key}: {value}px")

    untouched_before = [item for item in definitions if item.get("id") != "shadcn-inspired"]
    untouched_after = [item for item in result if item.get("id") != "shadcn-inspired"]
    if untouched_before != untouched_after:
        raise AssertionError("An unrelated theme changed")
    return result, changes


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[2])
    parser.add_argument("--apply", action="store_true", help="Write the reviewed proposal")
    args = parser.parse_args()
    path = args.root / "tooling/theme-candidates/definitions.json"
    original = path.read_text()
    result, changes = proposal(json.loads(original))
    print(json.dumps({"mode": "apply" if args.apply else "preview", "path": str(path), "changes": changes}, indent=2))
    if args.apply and changes:
        # Refuse an intervening write by another agent after our initial read.
        if path.read_text() != original:
            raise RuntimeError("Definitions changed while preparing update; retry after coordination")
        path.write_text(json.dumps(result, indent=2, ensure_ascii=True) + "\n")


if __name__ == "__main__":
    main()
