import '@en-reve/elements/define/validation-summary.js';
import { emitPropertyRegistrations, emitThemeCSS, resolveTheme } from '@en-reve/tokens';
import type { EnValidationSummary } from '@en-reve/elements/validation-summary.js';

/** Documentation-owned integration review; no component behavior is simulated. */
const byId = <T extends HTMLElement = HTMLElement>(id: string) => {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing theme customization element: ${id}`);
  return element as T;
};
const setSource = (id: string, source: string) => { byId(id).textContent = source; };
const themeStyle = document.createElement('style');
themeStyle.dataset.themeCustomization = '';
document.head.append(themeStyle);

const boundarySource = `import { emitThemeCSS, resolveTheme } from '@en-reve/tokens';

const theme = resolveTheme({
  name: 'customization-review',
  pins: { 'radius.container': { value: 8, unit: 'px' } },
});

// A complete boundary resets public component overrides.
emitThemeCSS(theme, { selector: '#full', colorScheme: true });

// A partial boundary changes only the selected tokens.
emitThemeCSS(theme, {
  selector: '#partial',
  kind: 'partial',
  tokenIds: ['radius.container'],
});`;
setSource('boundary-source', boundarySource);
setSource('override-source', `/* Ancestor customization, outside all four boundaries. */
.ancestor { --en-validation-summary-radius: 32px; }

/* Full output resets the hook; the component uses its fallback. */
#full { --en-validation-summary-radius: initial; }

/* The Before specimen intentionally recreates the former leak. */
#before { --en-validation-summary-radius: inherit; }

/* The application can still author a value on the component. */
#local en-validation-summary { --en-validation-summary-radius: 2px; }

/* The real component's shared style consumes the hook. */
border-radius: var(--en-validation-summary-radius, var(--en-radius-container));`);

async function measureBoundaries() {
  const specimens = ['before', 'full', 'partial', 'local'] as const;
  await Promise.all(specimens.map(id => byId(`boundary-${id}`).querySelector<EnValidationSummary>('en-validation-summary')?.updateComplete));
  for (const id of specimens) {
    const summary = byId(`boundary-${id}`).querySelector('en-validation-summary')?.shadowRoot?.querySelector('[part="base"]');
    byId(`radius-${id}`).textContent = summary ? getComputedStyle(summary).borderTopLeftRadius : 'Unavailable';
  }
}

function updateBoundaryTheme() {
  const mode = byId<HTMLSelectElement>('boundary-appearance').value === 'dark' ? 'dark' : 'light';
  const theme = resolveTheme({ name: 'customization-review', mode, pins: { 'radius.container': { value: 8, unit: 'px' } } });
  const pageTheme = resolveTheme({ name: 'customization-page', mode });
  themeStyle.textContent = emitThemeCSS(pageTheme, { scope: 'root', colorScheme: true })
    + ['before', 'full', 'local'].map(id => emitThemeCSS(theme, { selector: `#boundary-${id}`, colorScheme: true })).join('\n')
    + emitThemeCSS(theme, { selector: '#boundary-partial', kind: 'partial', tokenIds: ['radius.container'] })
    // Scoped simulation only: deliberately undo this single reset in Before.
    + '\n#boundary-before { --en-validation-summary-radius: inherit; }';
  void measureBoundaries();
}

byId<HTMLInputElement>('ancestor-radius').addEventListener('input', event => {
  const value = `${(event.currentTarget as HTMLInputElement).value}px`;
  byId('boundary-specimens').style.setProperty('--en-validation-summary-radius', value);
  byId('ancestor-radius-value').textContent = value;
  void measureBoundaries();
});
byId('boundary-appearance').addEventListener('change', updateBoundaryTheme);
updateBoundaryTheme();

// Keep the examples on separate names: @property registration is document-wide.
const registrationTheme = resolveTheme();
const compatibleCSS = emitPropertyRegistrations(registrationTheme, {
  mode: 'compatible', names: [],
  definitions: {
    '--en-demo-compatible-level': { syntax: '*', inherits: true },
    '--en-demo-compatible-tint': { syntax: '*', inherits: true },
  },
});
const typedCSS = emitPropertyRegistrations(registrationTheme, {
  mode: 'typed', names: [],
  definitions: {
    '--en-demo-typed-level': { syntax: '<number>', inherits: true, initialValue: '0.25' },
    '--en-demo-typed-tint': { syntax: '<color>', inherits: true, initialValue: '#6553c0' },
  },
});
const registrationStyle = document.createElement('style');
registrationStyle.dataset.themeCustomizationRegistrations = '';
registrationStyle.textContent = compatibleCSS + '\n' + typedCSS;
document.head.append(registrationStyle);
setSource('compatible-source', compatibleCSS);
setSource('typed-source', typedCSS + `

.preview {
  transition: --en-demo-typed-level 650ms ease,
              --en-demo-typed-tint 650ms ease;
}
@media (prefers-reduced-motion: reduce) {
  .preview { transition: none; }
}`);
setSource('configuration-source', `import {
  createPropertyRegistrationPlan,
  emitPropertyRegistrations,
  resolveTheme,
} from '@en-reve/tokens';

const theme = resolveTheme();

// The generated default stylesheet already includes compatible
// registrations. Choose a policy once for the entire document.
const plan = createPropertyRegistrationPlan(theme, {
  mode: 'compatible',
});

// Register an application-owned typed value explicitly.
// names: [] selects only the supplied definitions.
const css = emitPropertyRegistrations(theme, {
  mode: 'typed',
  names: [],
  definitions: {
    '--app-progress': {
      syntax: '<number>',
      inherits: true,
      initialValue: '0',
    },
  },
});

// Inspect plan.registrations / plan.exclusions before emitting.`);

const supportsRegistration = typeof CSS !== 'undefined' && 'registerProperty' in CSS;
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const states = {
  unset: undefined,
  calm: { level: '.25', tint: '#6553c0' },
  bright: { level: '.85', tint: '#b84672' },
  invalid: { level: 'not-a-number', tint: 'not-a-color' },
} as const;
type PropertyState = keyof typeof states;
let currentState: PropertyState = 'unset';
let readoutFrame = 0;

function measureRegistrations() {
  for (const mode of ['compatible', 'typed'] as const) {
    const computed = getComputedStyle(byId(`${mode}-preview`));
    for (const role of ['level', 'tint'] as const) {
      const value = computed.getPropertyValue(`--en-demo-${mode}-${role}`).trim();
      byId(`${mode}-${role}`).textContent = value || (role === 'level' ? 'unset → fallback .25' : 'unset → fallback #6553c0');
    }
  }
}

function updateRegistrationStatus() {
  const message = !supportsRegistration
    ? 'This browser does not expose property registration. Both samples behave as unregistered custom properties.'
    : currentState === 'invalid'
      ? 'Invalid input: compatible values stay untyped; typed values resolve to the registered initial values.'
      : currentState === 'unset'
        ? 'Declarations removed: compatible samples use var() fallbacks; typed samples use registered initial values.'
        : `Valid ${currentState} values applied. Typed values ${motion.matches ? 'update immediately because reduced motion is enabled' : 'interpolate over 650ms'}.`;
  byId('registration-status').textContent = message;
}

function applyPropertyState(state: PropertyState) {
  currentState = state;
  const values = states[state];
  for (const mode of ['compatible', 'typed'] as const) {
    const target = byId(`${mode}-preview`);
    for (const role of ['level', 'tint'] as const) {
      const name = `--en-demo-${mode}-${role}`;
      if (values) target.style.setProperty(name, values[role]);
      else target.style.removeProperty(name);
    }
  }
  for (const button of document.querySelectorAll<HTMLButtonElement>('[data-property-state]')) {
    button.setAttribute('aria-pressed', String(button.dataset.propertyState === state));
  }
  cancelAnimationFrame(readoutFrame);
  const end = performance.now() + (motion.matches ? 0 : 750);
  const read = () => {
    measureRegistrations();
    if (performance.now() < end) readoutFrame = requestAnimationFrame(read);
  };
  read();
  updateRegistrationStatus();
}

for (const button of document.querySelectorAll<HTMLButtonElement>('[data-property-state]')) {
  button.addEventListener('click', () => applyPropertyState(button.dataset.propertyState as PropertyState));
}
motion.addEventListener('change', updateRegistrationStatus);
applyPropertyState('unset');

if (new URLSearchParams(location.search).has('progress-report')) {
  byId('progress-return').hidden = false;
  for (const anchor of document.querySelectorAll<HTMLAnchorElement>('a[data-preserve-report]')) {
    const url = new URL(anchor.href);
    url.searchParams.set('progress-report', '');
    anchor.href = url.href;
  }
}
