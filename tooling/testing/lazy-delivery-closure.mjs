/** Concrete existing assertion owners for the opt-in delivery rollout. No timing or historical acquisition. */
export const deliveryBrowserOwners = [
 ['api-forms','probes/api-forms/playwright.config.ts'],
 ['api-localization','probes/api-localization/playwright.config.ts'],
 ['api-outcomes','probes/api-outcomes/playwright.config.ts'],
 ['forms-native','packages/elements/src/forms-private/tests/playwright.config.ts'],
 ['combobox','packages/elements/src/combobox/tests/playwright.config.ts'],
 ['combobox-mobile','packages/elements/src/combobox/tests/playwright.mobile.config.ts'],
 ['commands-mobile','packages/elements/src/commands/tests/playwright.mobile.config.ts'],
 ['patterns','packages/elements/src/patterns/tests/playwright.config.ts'],
 ['popup-motion','packages/ssr/tests/popup-motion/playwright.config.ts'],
 ['dialog','packages/elements/src/dialog/tests/playwright.config.mjs'],
 ['editor-composition','probes/composable-editor/playwright.config.ts'],
 ['rich-ranges','probes/rich-ranges/playwright.config.ts'],
];
export const deliveryNodeSources = [
 'packages/elements/src/date-picker/tests/deferred.test.mjs',
 'packages/elements/src/calendar/tests/calendar-adapter.test.mjs',
 'packages/elements/src/calendar/tests/calendar-ssr.test.mjs',
 'packages/elements/src/calendar/tests/date-range.test.mjs',
 'packages/primitives/tests/calendar.test.mjs',
 'probes/api-forms/metadata.test.mjs',
 'probes/api-localization/metadata.test.mjs',
 'probes/api-localization/ssr.test.mjs',
 'apps/docs/tests/api-reference-generator.test.mjs',
 'apps/docs/tests/specimen-source-assembly.test.mjs',
];
export function isDeliveryChange(path) {
 return /^(?:packages\/ssr\/|packages\/elements\/src\/(?:delivery[^/]*|lazy[^/]*|editor-toolbar|media-viewer)\.ts$|packages\/elements\/src\/(?:combobox|command-palette|pagination|date-picker)(?:\/|\.ts$)|packages\/elements\/src\/internal\/(?:delivery[^/]*|date-picker-feature)\.ts$|probes\/(?:lazy-delivery|lazy-delivery-editor|lazy-delivery-pagination)\/|tooling\/metadata\/(?:delivery[^/]*|lazy-manifest)\.[cm]?ts$)/.test(path)
  || [
   'apps/docs/src/rich-text-demo.ts',
   'apps/docs/src/component-patterns.ts',
   'apps/docs/src/workflows/selection/template.ts',
   'apps/docs/scripts/generate-api-examples.d.mts',
   'apps/docs/scripts/generate-api-examples.mjs',
   'apps/docs/scripts/generate-api-reference.mjs',
   'apps/docs/scripts/prepare-docs-producer.mjs',
   'apps/docs/scripts/api-example-ownership.mjs',
   'apps/docs/scripts/authored-specimen-sources.mjs',
   'apps/docs/src/composable-chat-color-delivery.ts',
   'apps/docs/src/composable-chat-color-ownership.mjs',
   'apps/docs/src/composable-chat-color-ownership.d.mts',
   'apps/docs/src/composable-chat-demo.definition.ts',
   'apps/docs/tests/api-reference-generator.test.mjs',
   'apps/docs/tests/specimen-source-assembly.test.mjs',
   'apps/docs/tests/specimen-sources.spec.ts',
   'apps/docs/tests/composable-chat.spec.ts',
  ].includes(path);
}
