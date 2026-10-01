# Planned component follow-up work

Current queue, accepted 2026-09-16: [component follow-up backlog](component-follow-up-backlog.md).
Implementation resumed with TREE-1 and UPLOAD-1/2. They are implemented with passing automated checks; remaining slices are still planned. Tree lazy branches and reordering are next.

The first pass of all standalone families in the retained list is implemented,
including rich text editing and its persistent/contextual toolbars. Existing
manual review and full supported-environment acceptance are still outstanding.

| Order | Next family pass | Planned slices |
| --- | --- | --- |
| 1 | Tree View | Multiple selection; lazy branches; accessible reordering |
| 2 | File upload | External `for` drop surfaces; realistic transfer simulation |
| 3 | Navigation / sidebar | Nested groups; responsive disclosure and composition |
| 4 | Split view / splitter | Collapse/restore; responsive focus safety |
| 5 | Tables / virtual collections | Consumer API evaluation; rendering/invalidation; VoiceOver investigation |
| 6 | Composer / editors | Clipboard interoperability; long-draft geometry and device qualification |
| 7 | Toasts | Expandable history; gestures; placement variants |
| 8 | Color picker | Wider color spaces; two-dimensional controls |
| 9 | Calendar / date picker | Ranges; time selection; alternate calendars |
| 10 | Carousel | Richer navigation; large/virtualized collections |
| 11 | Activity feed | Large/virtualized history and accessible reading alternatives |

The canonical backlog defines dependencies, acceptance boundaries and scope
accounting. The previously unscheduled enhancements in rows 7–11 are now committed
planned work. The 72-pattern inventory does not gain units for extension passes.
The Progress Report adds 16 relative effort units for this newly agreed scope.

Cross-family review, documentation, framework/package consumption, theme adoption,
release tooling and performance evidence remain real work in existing workstreams.
Source presence is not acceptance. Older family plans retain their baseline history;
this index supersedes their historical “next” sequence.

Charts, QR codes, OTP/PIN entry, hover-preview cards and custom scroll areas remain
uncommitted discussion candidates, outside the follow-up list accepted in this turn.
