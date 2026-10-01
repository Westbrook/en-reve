# Native theme validation record

Routine reflow and relative-text enlargement are covered by Playwright: 640px and
320px widths model 200%/400% layout reflow from 1280px, and a separate 200% root-text
case verifies actual computed input text scaling. The matrix covers all three themes,
both appearances, LTR/RTL and Chromium/Firefox/WebKit. See the
[regression coverage](/reviews/theme-customization/theme-regression.md?progress-report).

The remaining checks require platform or assistive-technology evidence. Record the actual
device, OS, browser/version, assistive technology/version, appearance, theme,
result and evidence for each run. Do not turn an unexecuted row into a pass.

| Check | Current evidence | Status |
| --- | --- | --- |
| VoiceOver with Safari: field names, exact-value editor, focus, errors and nested dialog | No speech/output evidence captured for this follow-up | Pending manual review |
| Physical iOS Safari: native select fallback, touch floor, orientation, keyboard and nested overlays | Device session unavailable in automated fixture matrix | Pending manual review |
| Native Windows high-contrast / forced colors | Playwright Chromium/Firefox emulation is separate evidence | Pending manual review |

Use the published [three-theme proof](https://en-reve-docs.reve-ai-0869.chatgpt.site/theme-proof?progress-report)
and [composition fixture](https://en-reve-docs.reve-ai-0869.chatgpt.site/theme-composition?progress-report).
Exercise Editorial, Precision and Studio in light/dark, then the opposite-appearance
nested region. Verify labels and errors are announced once, focus remains visible,
editing/selection survive theme changes, content is reachable without clipping,
and dialogs return focus appropriately.

Native browser zoom is a targeted diagnostic if a browser-specific issue warrants
it, not a routine outstanding requirement. If used, record the browser's displayed
percentage; viewport reduction and root sizing do not claim native zoom execution.
The earlier unapproved Chrome session therefore does not block routine reflow validation.

Screen-reader review must observe assistive-technology output and keyboard operation;
an accessibility tree or axe scan alone does not close it. Existing user feedback
stays open until its own recheck or explicit disposition. These rows are not a new
approval gate for publishing the independently verified code and documentation.
