const buttonManifest = "const source = Object.freeze({'en-button': () => import('@en-reve/elements/definitions/button.js').then(m => m.buttonDefinition)});";
const selective = `${buttonManifest}\nexport const loaders = source;`;
const profile = `import {createDeliveryProfile} from '@en-reve/elements/delivery.js';\n${buttonManifest}\nexport const loaders = createDeliveryProfile({schemaVersion: 1, id: 'fixture/button', version: '1', loaders: source, features: [], initialProperties: []}).loaders;`;
const canonical = "export {elementLoaders as loaders} from '@en-reve/elements/lazy-manifest.js';";
const eager = "import {datePickerDefinition} from '@en-reve/elements/definitions/date-picker.js'; export const getDefinition = async () => datePickerDefinition; export const prepareFeature = null;";
const staticShell = "import {datePickerShellDefinition} from '@en-reve/elements/date-picker-shell.js'; export const getDefinition = async () => datePickerShellDefinition; export const prepareFeature = null;";
const shell = "export const getDefinition = () => import('@en-reve/elements/date-picker-shell.js').then(m => m.datePickerShellDefinition); export const prepareFeature = null;";
const common = "import {datePickerSingleDeferredProfile as profile} from '@en-reve/elements/delivery-date-picker.js'; import {prepareDelivery} from '@en-reve/elements/delivery.js'; export const getDefinition = () => profile.loaders['en-date-picker'](); export const prepareFeature = () => prepareDelivery(profile, ['en-reve/en-date-picker/calendar']);";
export const variants = [];
function add(subject, fixture, family, policy, selected, baseline = null, entry = `${family}.mjs`) {
  variants.push({id: `${subject}/${fixture}`, subject, fixture, family, policy, selected, entry, baseline, pair: fixture});
}
for (const subject of ['reference', 'candidate']) {
  add(subject, 'api-selective', 'api', 'selective', selective, subject === 'candidate' ? 'reference/api-selective' : null);
  add(subject, 'api-canonical', 'api', 'canonical', canonical, subject === 'candidate' ? 'reference/api-canonical' : null);
  for (const policy of ['eager', 'construction', 'cold', 'prepared', 'immediate', 'unused', 'abandoned']) {
    add(subject, `date-${policy}`, 'date', policy, ['eager', 'construction'].includes(policy) ? eager : subject === 'reference' ? shell : common, subject === 'candidate' ? `reference/date-${policy}` : null);
  }
  add(subject, 'date-shell-static', 'date', 'cold', staticShell, subject === 'candidate' ? 'reference/date-shell-static' : null);
}
add('candidate', 'api-profile', 'api', 'profile', profile, 'reference/api-selective');
add('candidate', 'metadata', 'metadata', 'inert', '', null, 'metadata.mjs');
add('candidate', 'report', 'report', 'presentation', '', null, 'report.mjs');
export const comparisons = [
  ...variants.filter(v => v.baseline).map(v => ({id: `${v.id}-versus-${v.baseline}`, reference: v.baseline, candidate: v.id, kind: v.family === 'api' ? 'api-overhead' : 'migration'})),
  ...variants.filter(v => v.family === 'date' && v.policy !== 'eager').map(v => ({id: `${v.id}-versus-eager`, reference: `${v.subject}/date-eager`, candidate: v.id, kind: 'date-benefit'})),
];
