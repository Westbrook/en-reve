# Theme migration requirements for the next package release

This theme slice is consolidated with the [combined API/theme migration record](/reviews/api-normalization/api-next-release.md?progress-report). This is an unreleased compatibility record. Keep all packages at `0.1.0` during
the accepted private review iteration. When preparing the next package release,
include these behavior changes in the release draft even when CEM shows no change.
The existing pre-1.0 policy places breaking changes in the next minor train.

| Change | Affected consumers | Required migration |
| --- | --- | --- |
| THEME-02 family refinements precede shared defaults | Buttons, inputs and shared surface/card consumers | A shared pin no longer overrides a supplied narrower family pin. Clear the narrower pin to use the shared default, or move the intended override to the family/instance. |
| THEME-02 segmented geometry stays local | Apps aligning segmented and ordinary controls | Opt into an aligned group's common minimum explicitly; do not rely on segmented inset enlarging unrelated controls. |
| THEME-06 formerly disconnected hooks now apply | Editors, toolbar, color controls, tables and ordinary single-date selection | Inspect inherited input/option/typography pins. Add selected/hover/pressed refinements where broad paint previously did not reach selected dates. Calendar ranges retain specialized treatment. |
| Follow-up label Part is reachable | Color-slider exact-value editor | Existing `::part(editor-label)` rules now style the visible combined setting/qualifier label. The subclass description states this meaning; ordinary slider's qualifier Part is unchanged. |

Source and examples: [precedence migration](/reviews/theme-customization/theme-02-cascade-migration.md?progress-report),
[composition migration](/reviews/theme-customization/theme-06-composition.md?progress-report), and the bounded follow-up in the
[theme decision register](api-normalization-audit/theme-decisions.md).

Before package publication: attach the actual base/candidate artifact identities,
carry these changes into the release draft's authored changes and migration fields,
run `npm run test:theme`, review the current manual validation record, and retain
the user's package-release decision. Documentation deployment is not npm release.

## Theme refresh recommendations implementation

The [authoring contract](theme-api-authoring-contract.md) records the additive roles, `fontStyle` editor/type addition, deliberate default pressed-feedback change and companion/provenance/relationship APIs. Keep THEME-02 and THEME-06 migration notes. Existing exact-build review envelopes require regeneration; source recipes remain authoritative. No package-version bump or publication is implied.
