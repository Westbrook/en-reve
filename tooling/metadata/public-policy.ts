/** Stable supported entry families; exposure is inventoried separately from support. */
export const publicEntryPolicy = {
  version: 1,
  additionalEntries: ['./activation.js', './element-scope.js', './lazy.js', './lazy-loader.js', './lazy-manifest.js', './delivery.js', './delivery-catalog.js', './delivery-profiles.js', './delivery-date-picker.js', './date-picker-shell.js', '.', './element.js', './catalog.js', './context.js', './editor-extensions.js', './editor-command-matcher.js', './rich-document.js', './events.js'],
  componentEntries: ['<component>.js', 'define/<component>.js', 'definitions/<component>.js'],
  otherDeepImports: 'Importable for staging compatibility; unsupported implementation details. No package export is removed by this policy.',
};

/** Behavioral families, with intentional exceptions kept explicit and reviewable. */
export function eventBehavior(tag: string, name: string) {
  const common = {bubbles: true, composed: true};
  if (['en-change', 'en-page-change', 'en-selection-change', 'en-sort', 'en-collapse'].includes(name)) return {...common, cancelable: true, phase: 'tentative-change', authority: 'Author writes and accepted nested proposals supersede rollback.'};
  if (name === 'en-toolbar-request') return {bubbles: false, composed: false, cancelable: true, phase: 'direct-host-association'};
  if (name === 'en-reorder') return {...common, cancelable: true, phase: 'structural-proposal'};
  if (name === 'en-action') return {...common, cancelable: tag !== 'en-calendar', phase: tag === 'en-calendar' ? 'notification' : 'application-request', ...(tag === 'en-menu' ? {delivery: 'forwarded-original-item-event'} : {})};
  if (name === 'en-load-request' || name === 'en-load' && tag === 'en-activity-feed') return {...common, cancelable: true, phase: 'application-request'};
  if (['en-input','en-load-state-change','en-load','en-toggle','en-reject','en-editor-state'].includes(name)) return {...common, cancelable: false, phase: name === 'en-input' ? 'draft' : 'notification'};
  throw new Error(`Unclassified public event behavior: ${tag}.${name}`);
}
