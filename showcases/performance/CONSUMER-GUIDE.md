# Keeping an En Reve application fast

This guide separates verified delivery facts from optimizations that still need workload-specific measurement. Its reference fixture is the standalone CSR showcase built from the pinned 0.1.0 tarballs. Version strings alone do not identify a prerelease build: retain lockfiles and tarball hashes.

## Establish a small production entry

Import only the definitions used by the route:

```js
import '@en-reve/elements/define/button.js';
import '@en-reve/elements/define/text-field.js';
```

Use the library's documented token/style setup for your application. Definition modules register their declared dependencies; do not manually copy internal implementation files or depend on private class names. In the measured package, `define/*.js` are marked as side effects so bundlers preserve registration. Keep this metadata intact. Verify the actual production output, because a syntactically narrow import may include necessary shared controls.

The isolated import-family builds in [the experiment inventory](reports/en-reve-experiments.json) quantify adoption costs. A date picker includes calendar/dialog/button/icon dependencies. Its self-contained family cost includes shared infrastructure and cannot simply be subtracted from the full showcase bundle. CSS embedded in component JavaScript counts toward JavaScript transfer and execution; a small external CSS file does not imply free styling.

Build with the supported native stack in production mode. Keep development tooling, documentation routes, theme pickers, source maps and this laboratory's collectors out of normal delivery. Source maps should remain available to your own diagnostics system. The benchmark fixtures already omit documentation navigation and alternate themes.

## Choose chunk boundaries for a concrete user benefit

Use immutable, content-hashed assets with Brotli/gzip negotiation and HTML revalidation. Keep module chunks on the same HTTP/2 origin unless your application has a separate reason for another origin. Verify the negotiated encoding and actual cache behavior in a browser; offline compression totals do not prove correct deployment headers.

The `split-vendor` experiment preserves an identical 75,369-byte Brotli vendor chunk across a small application-only edit. Its total JavaScript is 83,017 bytes versus 82,291 bytes for the frozen single-bundle entry. That is a caching tradeoff: a slightly larger initial transfer can avoid retransmitting stable dependencies on later deployments. Measure your real deployment frequency and routes before adopting the boundary. Separate eager chunks do not defer JavaScript execution.

The command-palette experiment shows why splitting every component is not a default optimization. Its initial entry is only about 1 KiB smaller, while eventual JavaScript grows and first activation must load another module. Validate first keyboard activation, focus, dialogs, error recovery and warm reuse. Intent preloading can help after a user signals interest but must preserve a cold keyboard path. Never hide a missing control or defer essential feedback just to improve a navigation metric.

In the corrected three-sample constrained-profile pilot, first command semantic readiness was 26.6 ms native, 186.8 ms lazy and 152.1 ms with immediate pointer intent; session INP did not expose that asynchronous wait. These exploratory medians are workload-specific, but the extra request and small initial saving make this boundary a poor default for the showcase. Cold keyboard activation was separately verified.

For larger routes, select boundaries around genuinely optional workflows or below-fold sections. Measure initial transfer, successful first use, subsequent use, cache retention and deployment invalidation together. Keep route-level decisions in the consumer application, where usage intent is known.

## Keep rendering work proportional to visible work

The showcase is intentionally dense. Do not assume an application should eagerly instantiate every form, calendar, overlay and settings panel on startup. Preserve accessible labels, keyboard order, form behavior and reserved layout space when introducing a lazy boundary. Test `customElements.whenDefined` and the component's supported update lifecycle when asynchronous registration is involved.

The `content-visibility` experiment uses normal browser rendering containment with intrinsic size reservation. It still downloads and instantiates the components. Accept it only after checking scroll behavior, layout shifts, focus navigation and first-reveal responsiveness at all supported widths. Guessed intrinsic heights can create their own layout problems; the application owns realistic sizing.

Update the narrowest state boundary that owns the changed information. The current En Reve fixture renders its full showcase template from one signal-backed parent; other fixtures use different application-state boundaries. A slow fixture update is not automatically a library defect. Profile the handler, component update and style/layout work before changing either layer.

Retain native Lit stylesheet sharing and lifecycle cleanup. Do not replace shared styles with per-instance generated styles merely to simplify a consumer wrapper. Measure connected DOM separately from browser-wide DOM/heap counters, which can include detached objects awaiting garbage collection. Repeated dialog or component creation should be tested over realistic session lengths.

## Validate the user's experience

Measure FCP/LCP and layout stability alongside the first successful action. For interactions, separate input delay, processing and presentation from the time a requested result actually becomes usable. A loading indicator appearing quickly is only the first part of an asynchronous workflow. Use rAF/Long Animation Frame or trace evidence for continuous scrolling/dragging; discrete INP does not describe those interactions.

Preserve each application's font requirements. If typography is optional in your own design, compare a clearly labelled font strategy; never compare a competitor with its font removed against En Reve's normal appearance. Reserve image dimensions and prioritize an LCP image when your application actually has one. The showcase's CSS artwork does not establish image-heavy application performance.

For expensive application work, use trace evidence to choose task splitting, `scheduler.yield` with a supported fallback, or a worker. Do not add workers for work that is not measurably blocking input. Test supported browsers and devices; local Chromium CPU throttling does not replace a representative phone or shipped Safari.

## Preserve the result over time

Keep an immutable known-good release anchor and a separate current-build lane. Run the library's correctness tests plus the showcase functional qualification before interpreting faster timings. PR checks should cover deterministic bytes and selected journeys; reference-runner campaigns should periodically cover the full fixed panel, memory/lifecycle and first-use costs. Require independent confirmation of timing regressions and explicit review of baseline promotions.

For a real application, add consent-appropriate, sampled `web-vitals/attribution` reporting through your existing telemetry system. Segment real-user p75 by device, navigation type and release without collecting input values or arbitrary DOM text. This repository does not provision a telemetry endpoint or send user data anywhere. Lab scripted-session INP remains a diagnostic until real usage confirms the experience.

Sources: [Optimize INP](https://web.dev/articles/optimize-inp), [web.dev performance](https://web.dev/performance), and the laboratory's retained manifests, family builds and cache-invalidation experiment. The guide's exact byte figures apply to those builds, not every consuming application.
