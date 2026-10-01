# EDIT-2: caret-relative picker geometry

Implemented for review, 2026-09-17. Both editor backends position typed suggestions
at the leading edge of the trigger glyph. Growing a query does not move the menu
horizontally. Wrapping follows the trigger's actual glyph rectangle; when the active
typing line would overlap the menu, vertical placement clears the trigger-to-caret
span. Manual extension opens use the saved caret and token edits use the chip.
The token adapter resolves logical offsets to DOM ranges without sentinel leakage;
the rich adapter maps document positions to the actual glyph range.
A small shared positioning helper flips above/below and clamps to the visual
viewport, follows logical direction and limits suggestions to a compact width.
Application-rendered pickers retain the wider editor-based width used by the color
picker. Scroll listeners cover editor and ancestor scrollports across Shadow DOM
boundaries; resize observation catches wrapping and picker content changes.
Observers/listeners are removed when the session closes or the editor disconnects.
Positioning never moves selection or inserts DOM markers.

When the trigger is scrolled out of view, a visible saved caret becomes the anchor.
When both are hidden, controls clamp to the visible editor/viewport edge. This does not cancel the session or change its target.
Existing Escape, async staleness, token edit and undo contracts remain unchanged.

The rich-text example includes Load long drafts for all three editor surfaces.
Use it to inspect mid-draft @ and / suggestions, internal and outer scrolling,
window resizing, RTL, contextual formatting and cancel/replacement behavior.
`editor-geometry.spec.ts` exercises these placements alongside existing editor,
composition-guard, theme and contextual-toolbar regressions.

Automated browser tests do not establish native IME, software keyboard, selection
handle or spoken VoiceOver behavior. Physical iOS/Android and real OS clipboard
review remain tracked work; long documents are scrollable, not virtualized.
