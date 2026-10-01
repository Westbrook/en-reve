/**
 * Authored fixture metadata, not an element API inventory.
 * Each selector is resolved exactly once per reset inside .api-example-content.
 * A zero/multiple match disables controls with a visible diagnostic.
 * Keep the captured node: changing label/value/variant must not retarget it.
 */
const target = (caseId, selector, title, excludedProperties = {}) => ({
	id: 'primary', caseId, selector, title, excludedProperties,
});
const slotLabel = 'This example supplies the label slot; edit authored content to change that label.';
const slotDescription = 'This example supplies the description slot; edit authored content to change that description.';
const relation = 'This identifier connects authored controls in the composition. Relationship editing needs a coordinated example.';
const owned = 'The parent collection owns this child state. Use the collection interaction; direct child editing needs a standalone example.';
const mirrored = 'This example updates a separate preview after user acceptance. A silent property write does not run that handler; use the live control or authored source.';
const resource = 'Resource/navigation editing needs a dedicated URL control; this first slice leaves authored URLs unchanged.';

export const apiControlTargets = {
  'en-data-table':target('data-table','#records-table','Records and columns comparison'),
  'en-carousel':target('carousel','#media-carousel','Cover studies'),
  'en-carousel-slide':target('carousel','#media-carousel > en-carousel-slide:first-of-type','First slide'),
	'en-presence':target('presence-activity','#presence-example','First collaborator'),
 'en-presence-group':target('presence-activity','#presence-group-example','Collaborators'),
 'en-activity-item':target('presence-activity','#activity-feed-example en-activity-item[data-entry="2"]','First update'),
 'en-activity-feed':target('presence-activity','#activity-feed-example','Today’s history'),
 'en-chat-message': target('chat-patterns', '#chat-message-example', 'Initial message'),
	'en-chat-composer': target('chat-patterns', '#chat-composer-example', 'Message composer'),
	'en-toast': target('toast', '#toast-example', 'Initial notification'),
	'en-toast-region': target('toast', 'en-toast-region[label="Demo notifications"]', 'Demo notifications'),
	'en-progress-step': target('multi-step', '#brief-progress en-progress-step[value="details"]', 'Project details descriptor'),
	'en-progress-steps': target('multi-step', '#brief-progress', 'Project brief steps', { items: 'Turn off child authoring in Review scenarios to try the array fallback. Direct en-progress-step children take precedence.' }),
	'en-validation-summary': target('multi-step', '#brief-errors', 'Project brief validation', { items: 'Submit the empty form to show errors. Turn off child authoring in Review scenarios before assigning an array of target/message objects.' }),
	'en-calendar': target('calendar', '#specimen-calendar', 'Inline review calendar'),
	'en-time-field': target('calendar', '#specimen-time-field', 'Review time entry', { label: slotLabel, description: slotDescription }),
	'en-date-picker': target('calendar', '#specimen-date-picker', 'Review date picker', { label: slotLabel, description: slotDescription }),
	'en-file-upload': target('file-upload', '#file-upload-choice', 'Study file selection', { label: slotLabel, description: slotDescription, files: 'Files are browser objects selected by the user; use the picker or drop files into this live example.' }),
	'en-tree': target('tree-view', '#specimen-tree', 'Project outline', { value: mirrored, virtualize: 'Virtualization applies to data trees. Use the Large data hierarchy example to switch its rendering mode.' }),
	'en-tree-item': target('tree-view', '#specimen-tree-item', 'Cover project item', { value: relation, label: slotLabel }),
	'en-pagination': target('pagination', '#api-pagination', 'Paginated project studies'),
	'en-table': target('authored-table', '#specimen-table', 'Project assets table scroll area'),
	'en-menu': target('command-surfaces', '#specimen-menu', 'Study layout action menu', { for: relation }),
	'en-menu-item': target('command-surfaces', '#specimen-menu-item', 'Portrait menu action', { action: relation }),
	'en-toolbar': target('command-surfaces', '#specimen-toolbar', 'Study layout toolbar'),
	'en-command-palette': target('command-surfaces', '#specimen-command-palette', 'Study command search', { for: relation, commands: 'This shared command catalog owns action IDs, labels and availability. Edit the authored composition to change the catalog.' }),
	'en-accordion': target('accordion', 'en-accordion', 'Disclosure collection'),
	'en-accordion-item': target('accordion', 'en-accordion-item[value="layout"]', 'Layout disclosure', { value: relation, open: owned }),
	'en-alert': target('messages', 'en-alert[variant="info"]', 'Export information message'),
	'en-avatar': target('card', 'en-avatar', 'Mira Chen avatar in the project card', { src: resource }),
	'en-badge': target('split-view-vertical', 'en-badge', 'Canvas preview badge'),
	'en-breadcrumbs': target('breadcrumbs', 'en-breadcrumbs', 'Pattern location breadcrumb'),
	'en-button': target('buttons', '#api-save-changes', 'Save changes button'),
	'en-card': target('card', 'en-card', 'Material exploration card'),
	'en-checkbox': target('checkboxes-switches', 'en-checkbox[checked]', 'Include source files checkbox', { label: slotLabel, description: slotDescription }),
	'en-color-slider': target('color-slider', 'en-color-slider', 'Gradient alpha slider'),
	'en-color-picker': target('color-picker', '#basic-color-picker', 'Inline accent color picker'),
	'en-color-field': target('color-field', 'en-color-field', 'Project accent field', { for: relation, value: mirrored }),
	'en-combobox': target('combobox', 'en-combobox', 'Project picker', { label: slotLabel, description: slotDescription }),
	'en-date-input': target('structured-values', 'en-date-input', 'Review date field'),
	'en-dialog': target('dialog-drawer', 'en-dialog', 'Invite to this project dialog', { for: relation }),
	'en-drawer': target('dialog-drawer', 'en-drawer', 'Project details drawer', { for: relation }),
	'en-icon': target('button-scale', 'en-link en-icon[name="arrow-right"]', 'Arrow icon in Explore form controls'),
	'en-link': target('button-scale', 'en-link', 'Explore form controls link', { href: resource, target: resource, download: resource }),
	'en-navigation': target('navigation-sidebar', '#workspace-navigation', 'Project navigation'),
  'en-navigation-group': target('navigation-sidebar', '#project-group', 'Project group'),
	'en-number-field': target('precision', 'en-number-field', 'Corner radius field'),
	'en-popover': target('popover-tooltip', 'en-popover', 'View options popover', { for: relation }),
	'en-progress-bar': target('loading', 'en-progress-bar', 'Export progress'),
	'en-radio': target('radio-group', 'en-radio[value="balanced"]', 'Balanced export option', { value: relation, checked: owned, name: relation }),
	'en-radio-group': target('radio-group', 'en-radio-group', 'Export quality group', { description: slotDescription }),
	'en-rating': target('rating', 'en-rating', 'Concept usefulness rating', { label: slotLabel, description: slotDescription }),
	'en-search-input': target('long-text-search', 'en-search-input', 'Find an asset search field'),
	'en-segmented-control': target('family-geometry', '.geometry-scope:nth-of-type(1) en-segmented-control', 'Canvas selector in the Shared defaults row'),
	'en-select': target('structured-values', 'en-select', 'Export format selection', { description: slotDescription }),
	'en-select-option': target('child-authored-choices', '#authored-svg-option', 'Authored SVG option'),
	'en-segmented-item': target('child-authored-choices', '#authored-landscape-item', 'Authored landscape choice'),
	'en-skeleton': target('loading', 'en-skeleton[shape="circle"]', 'Circular loading placeholder'),
	'en-slider': target('opacity', 'en-slider', 'Layer opacity slider', { label: slotLabel, description: slotDescription, value: mirrored }),
	'en-spinner': target('loading', 'en-spinner', 'Preparing preview spinner'),
	'en-split-view': target('split-view', '#workspace-split', 'Collapsible navigation and inspector workspace'),
	'en-stack': target('typography', 'en-stack', 'Typography role stack'),
	'en-swatch': target('swatches', 'en-swatch', 'Action color sample', { token: mirrored, color: 'This token-copy specimen supplies token, which takes precedence over the raw color fallback.' }),
	'en-switch': target('checkboxes-switches', 'en-switch[checked]', 'Live preview switch', { label: slotLabel, description: slotDescription }),
	'en-tab': target('tabs', '#inspector-tab-design', 'Design tab', { value: relation }),
	'en-tab-panel': target('tabs', '#inspector-panel-design', 'Design tab panel', { value: relation }),
	'en-tabs': target('tabs', 'en-tabs', 'Inspector sections tabs'),
	'en-text-field': target('text-fields', 'en-text-field[label="Project name"]', 'Project name field', { description: slotDescription }),
	'en-textarea': target('long-text-search', 'en-textarea', 'Creative direction field', { description: slotDescription }),
	'en-tooltip': target('tooltip-warmup', '#canvas-guidance-tooltip', 'Canvas guidance tooltip', { for: relation, warmupGroup: relation }),
};

// en-splitter is intentionally absent: the API page has no authored standalone
// example. A private en-split-view shadow descendant is not a consumer target.
