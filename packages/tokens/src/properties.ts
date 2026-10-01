import type { ResolvedTheme } from './types.js';
import { customizationContracts } from './customization.js';
import { resolveTheme } from './theme.js';
import { deepFreeze, TokenError } from './value.js';

/** Portable registration grammars. Compound CSS values retain the universal syntax. */
export type PropertyRegistrationSyntax = '*' | '<color>' | '<number>' | '<integer>' | '<length>' | '<length-percentage>' | '<percentage>' | '<angle>' | '<time>';
export interface PropertyRegistrationDefinition {
  syntax: PropertyRegistrationSyntax;
  inherits: boolean;
  /** A concrete, computationally independent CSS value; omitted only for universal syntax. */
  initialValue?: string;
}
export interface PropertyRegistrationOptions {
  /** Typed registration changes defaulting/computation semantics and is an explicit opt-in. */
  mode?: 'compatible' | 'typed';
  /** CSS property names to include. Omit for the entire public contract; [] selects only definitions. */
  names?: readonly string[];
  /** Explicit global contracts, including application-owned names; false excludes a library property. */
  definitions?: Readonly<Record<string, PropertyRegistrationDefinition | false>>;
}
export interface PropertyRegistration extends PropertyRegistrationDefinition {
  name: string;
  policy: 'compatible' | 'typed' | 'explicit';
  reason: string;
}
export interface PropertyRegistrationPlan {
  registrations: readonly PropertyRegistration[];
  exclusions: readonly {name: string; reason: string}[];
}

const syntaxes = new Set<PropertyRegistrationSyntax>(['*','<color>','<number>','<integer>','<length>','<length-percentage>','<percentage>','<angle>','<time>']);
const numeric = '[+-]?(?:\\d+(?:\\.\\d*)?|\\.\\d+)(?:[eE][+-]?\\d+)?';
const numberRE = new RegExp(`^${numeric}$`);
const dimensionRE = new RegExp(`^(${numeric})(px|cm|mm|q|in|pt|pc)$`, 'i');
const percentRE = new RegExp(`^(${numeric})%$`);
const timeRE = new RegExp(`^(${numeric})(ms|s)$`, 'i');
const angleRE = new RegExp(`^(${numeric})(deg|grad|rad|turn)$`, 'i');
const finiteMatch = (value: string, re: RegExp) => { const match = re.exec(value); return !!match && Number.isFinite(Number(match[1] ?? match[0])); };

/** Intentionally accepts concrete colors, not context-dependent currentColor/system colors. */
function concreteColor(value: string): boolean {
  if (/^#[\da-f]{3}(?:[\da-f]|[\da-f]{3}|[\da-f]{5})?$/i.test(value)) return true;
  if (/^(transparent|black|white|red|green|blue|yellow|cyan|magenta|gray|grey|orange|purple|rebeccapurple)$/i.test(value)) return true;
  const fn = /^(rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch|color)\(([^()]*)\)$/i.exec(value);
  if (!fn) return false;
  let body = fn[2].trim();
  const name = fn[1].toLowerCase();
  if (name === 'color') {
    const space = /^(srgb|srgb-linear|display-p3|a98-rgb|prophoto-rgb|rec2020|xyz|xyz-d50|xyz-d65)\s+/i.exec(body);
    if (!space) return false;
    body = body.slice(space[0].length);
  }
  if (body.includes(',')) {
    if (!['rgb','rgba','hsl','hsla'].includes(name) || body.includes('/')) return false;
    const parts = body.split(',').map(v => v.trim());
    if (![3,4].includes(parts.length)) return false;
    if (name.startsWith('rgb') && !parts.slice(0,3).every(v => percentRE.test(v) === percentRE.test(parts[0]))) return false;
    body = parts.slice(0,3).join(' ') + (parts[3] === undefined ? '' : ` / ${parts[3]}`);
  }
  const groups = body.split('/');
  if (groups.length > 2) return false;
  const channels = groups[0].trim().split(/\s+/);
  if (channels.length !== 3) return false;
  const numericChannel = (v: string) => finiteMatch(v,numberRE) || finiteMatch(v,percentRE);
  if (groups[1] !== undefined && !numericChannel(groups[1].trim())) return false;
  return channels.every((v,i) => {
    const hue = (name.startsWith('hsl') || name === 'hwb') ? i === 0 : (name === 'lch' || name === 'oklch') && i === 2;
    if (hue) return finiteMatch(v,numberRE) || finiteMatch(v,angleRE);
    if (name.startsWith('hsl') || name === 'hwb') return finiteMatch(v,percentRE);
    return numericChannel(v);
  });
}

function validateDefinition(name: string, definition: PropertyRegistrationDefinition): void {
  const fail = (message: string): never => { throw new TokenError('invalid-property-registration', `${name}: ${message}`); };
  if (!/^--[a-zA-Z][a-zA-Z\d_-]*$/.test(name)) fail('use a public CSS custom property name.');
  if (!definition || !syntaxes.has(definition.syntax) || typeof definition.inherits !== 'boolean') fail('supply a supported syntax and an explicit inherits boolean.');
  const initial = definition.initialValue;
  if (initial === undefined) {
    if (definition.syntax !== '*') fail('typed properties require an independent initialValue.');
    return;
  }
  if (typeof initial !== 'string' || !initial.trim() || /[{};\u0000-\u001f\\"'<>]|\/\*|\*\//.test(initial)) fail('initialValue must be a concrete CSS value without declaration syntax.');
  const value = initial.trim();
  const length = () => value === '0' || finiteMatch(value,dimensionRE);
  let valid: boolean;
  switch (definition.syntax) {
    case '<number>': valid = finiteMatch(value,numberRE); break;
    case '<integer>': valid = /^[+-]?\d+$/.test(value) && Number.isSafeInteger(Number(value)); break;
    case '<length>': valid = length(); break;
    case '<length-percentage>': valid = length() || finiteMatch(value,percentRE); break;
    case '<percentage>': valid = finiteMatch(value,percentRE); break;
    case '<angle>': valid = finiteMatch(value,angleRE); break;
    case '<time>': valid = finiteMatch(value,timeRE); break;
    case '<color>': valid = concreteColor(value); break;
    case '*':
      // Universal definitions do not need an initial value. Restrict explicit
      // initials to independent primitives so var()/em/currentColor cannot be
      // mistaken for globally stable defaults by the authoring API.
      valid = finiteMatch(value,numberRE) || length() || finiteMatch(value,percentRE) || finiteMatch(value,timeRE) || finiteMatch(value,angleRE) || concreteColor(value);
  }
  if (!valid) fail(`initialValue does not match ${definition.syntax}, is context-dependent, or is outside the supported concrete-value grammar.`);
}

let baseline: ResolvedTheme | undefined;
function canonicalTypedDefinition(name: string, tokenId?: string): PropertyRegistrationDefinition | undefined {
  if (!tokenId || tokenId.startsWith('component.')) return;
  const token = (baseline ??= resolveTheme()).tokens[tokenId];
  if (!token || token.cssName !== name) return;
  const syntax: PropertyRegistrationSyntax | undefined = token.type === 'color' ? '<color>'
    : token.type === 'number' && tokenId !== 'layout.prose-max' ? '<number>'
    : token.type === 'fontWeight' ? '<number>'
    : token.type === 'duration' ? '<time>'
    : token.type === 'dimension' && finiteMatch(token.cssValue,dimensionRE) ? '<length>' : undefined;
  if (!syntax) return;
  const definition = {syntax,inherits:true,initialValue:token.cssValue};
  validateDefinition(name,definition);
  return definition;
}

/**
 * Plan document-wide registrations independently from any one theme boundary.
 * Canonical typed initials never depend on theme pins, appearance or density.
 * Optional component overrides retain the guaranteed-invalid initial value.
 */
export function createPropertyRegistrationPlan(theme: ResolvedTheme, options: PropertyRegistrationOptions = {}): PropertyRegistrationPlan {
  if (options.mode !== undefined && !['compatible','typed'].includes(options.mode)) throw new TokenError('invalid-property-registration','Unknown registration mode.');
  const contracts = customizationContracts(theme);
  const byName = new Map(contracts.map(contract => [contract.cssName,contract]));
  const definitions = options.definitions ?? {};
  const names = new Set(options.names ?? byName.keys());
  for (const name of Object.keys(definitions)) names.add(name);
  const registrations: PropertyRegistration[] = [], exclusions: {name:string;reason:string}[] = [];
  for (const name of [...names].sort()) {
    const contract = byName.get(name);
    const explicit = definitions[name];
    if (!contract && explicit === undefined) throw new TokenError('unknown-customization-property',`Unknown CSS customization property ${name}. Supply an explicit definition for application-owned properties.`);
    if (explicit === false) { exclusions.push({name,reason:'Explicitly excluded from registration.'}); continue; }
    if (explicit !== undefined) {
      validateDefinition(name,explicit);
      registrations.push({name,syntax:explicit.syntax,inherits:explicit.inherits,
        ...(explicit.initialValue === undefined ? {} : {initialValue:explicit.initialValue}),
        policy:'explicit',reason:'Explicit application contract; initial/inheritance changes are intentional.'});
      continue;
    }
    const typed = options.mode === 'typed' ? canonicalTypedDefinition(name,contract?.tokenId) : undefined;
    if (typed) registrations.push({name,...typed,policy:'typed',reason:'Opt-in typed semantic token with a stable canonical initial value.'});
    else registrations.push({name,syntax:'*',inherits:contract!.inherits,policy:'compatible',reason:options.mode === 'typed'
      ? 'Preserves optional fallback, context-dependent values, configuration or compound CSS grammar; use an explicit definition to opt into different semantics.'
      : 'Preserves inherited token streams and guaranteed-invalid initial values, including var() fallbacks.'});
  }
  return deepFreeze({registrations,exclusions});
}

/** Emit once per document. Registrations are global; theme selectors do not scope them. */
export function emitPropertyRegistrations(theme: ResolvedTheme, options: PropertyRegistrationOptions = {}): string {
  const plan = createPropertyRegistrationPlan(theme,options);
  return '/* En Rêve public custom property registrations. Load one policy per document. */\n' + plan.registrations.map(({name,syntax,inherits,initialValue}) =>
    `@property ${name} {\n  syntax: "${syntax}";\n  inherits: ${inherits};${initialValue === undefined ? '' : `\n  initial-value: ${initialValue.trim()};`}\n}`
  ).join('\n') + '\n';
}
