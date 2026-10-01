/** Authored registration ownership for this one consumer; reading it loads no components. */
export const composableChatColorOwnership = Object.freeze({
  schemaVersion: 1,
  exampleId: 'composable-chat',
  profileId: 'en-reve-docs/composable-chat-color',
  profileVersion: '1',
  featureId: 'en-reve-docs/composable-chat-color/popup',
  featureVersion: '1',
  sourceModule: './composable-chat-color-delivery.js',
  loaderExport: 'composableChatColorLoaders',
  eagerTags: Object.freeze([
    'en-button', 'en-chat-composer', 'en-composable-chat-demo',
    'en-editor-trigger', 'en-select', 'en-token-editor',
  ]),
  optionalTags: Object.freeze([
    'en-color-picker', 'en-swatch', 'en-tab', 'en-tab-panel', 'en-tabs',
  ]),
});
