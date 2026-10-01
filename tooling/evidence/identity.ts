import { createHash } from 'node:crypto';

export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
export type Digest = `sha256:${string}`;

/** Stable JSON, deliberately rejecting lossy values instead of silently hashing them. */
export function canonicalJson(value: unknown): string {
  const ancestors = new Set<object>();
  function encode(item: unknown): string {
    if (item === null || typeof item === 'string' || typeof item === 'boolean') return JSON.stringify(item);
    if (typeof item === 'number' && Number.isFinite(item)) return JSON.stringify(item);
    if (typeof item !== 'object' || item === null) throw new TypeError('Identity inputs must be finite JSON values.');
    if (ancestors.has(item)) throw new TypeError('Identity inputs cannot contain cycles.');
    ancestors.add(item);
    let result: string;
    if (Array.isArray(item)) {
      for (let index = 0; index < item.length; index++) {
        if (!(index in item)) throw new TypeError('Identity inputs cannot contain sparse arrays.');
      }
      result = `[${item.map(encode).join(',')}]`;
    } else {
      if (Object.getPrototypeOf(item) !== Object.prototype && Object.getPrototypeOf(item) !== null) {
        throw new TypeError('Identity inputs must use plain JSON objects.');
      }
      if (Object.getOwnPropertySymbols(item).length) throw new TypeError('Identity inputs cannot contain symbols.');
      const record = item as Record<string, unknown>;
      result = `{${Object.keys(record).sort().map(key => `${JSON.stringify(key)}:${encode(record[key])}`).join(',')}}`;
    }
    ancestors.delete(item);
    return result;
  }
  return encode(value);
}

export function digestBytes(value: string | Uint8Array): Digest {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`;
}

export function digestJson(value: unknown): Digest {
  return digestBytes(canonicalJson(value));
}

export function assertDigest(value: unknown): asserts value is Digest {
  if (typeof value !== 'string' || !value.startsWith('sha256:') || value.length !== 71 ||
    [...value.slice(7)].some(character => !'0123456789abcdef'.includes(character))) {
    throw new TypeError('Expected a lowercase SHA-256 content digest.');
  }
}

export type IdentityKind = 'rendering' | 'comparison' | 'review';
export interface Identity {
  schemaVersion: 1;
  kind: IdentityKind;
  digest: Digest;
  inputs: Json;
}

function identity(kind: IdentityKind, inputs: unknown): Identity {
  const cleanInputs = JSON.parse(canonicalJson(inputs)) as Json;
  return { schemaVersion: 1, kind, digest: digestJson({ schemaVersion: 1, kind, inputs: cleanInputs }), inputs: cleanInputs };
}

/** All values describe content/configuration, not mutable branch names or version labels alone. */
export interface RenderingInputs {
  artifacts: Record<string, Digest>;
  fixture: Digest;
  testCode: Digest;
  resolvedDependencies: Record<string, Digest>;
  theme: Digest;
  assets: Record<string, Digest>;
  environment: Json;
  locale: string;
  direction: 'ltr' | 'rtl';
  preferences: Json;
  viewport: Json;
  readiness: Json;
  capture: Json;
}

export function renderingIdentity(inputs: RenderingInputs): Identity {
  for (const table of [inputs.artifacts, inputs.resolvedDependencies, inputs.assets]) {
    if (!table || typeof table !== 'object' || Array.isArray(table)) throw new TypeError('Rendering content tables are required.');
    Object.values(table).forEach(assertDigest);
  }
  if (Object.keys(inputs.artifacts).length === 0) throw new TypeError('Rendering requires at least one artifact.');
  [inputs.fixture, inputs.testCode, inputs.theme].forEach(assertDigest);
  for (const field of ['environment', 'preferences', 'viewport', 'readiness', 'capture'] as const) {
    if (inputs[field] === undefined) throw new TypeError(`Rendering ${field} must be declared.`);
  }
  if (!inputs.locale || !['ltr', 'rtl'].includes(inputs.direction)) throw new TypeError('Rendering locale and direction are required.');
  return identity('rendering', inputs);
}

export function comparisonIdentity(inputs: {
  candidateImage: Digest;
  baselineImage: Digest;
  implementation: Digest;
  settings: Json;
}): Identity {
  [inputs.candidateImage, inputs.baselineImage, inputs.implementation].forEach(assertDigest);
  return identity('comparison', inputs);
}

/** A key scopes a review request; constructing or caching it never grants approval. */
export function reviewIdentity(inputs: {
  candidate: Digest;
  baseline: Digest;
  scope: Json;
  evidence: Digest[];
}): Identity {
  [inputs.candidate, inputs.baseline, ...inputs.evidence].forEach(assertDigest);
  return identity('review', { ...inputs, evidence: [...new Set(inputs.evidence)].sort() });
}

export function validateIdentity(value: Identity): void {
  if (value.schemaVersion !== 1 || !['rendering', 'comparison', 'review'].includes(value.kind)) {
    throw new TypeError('Unknown evidence identity schema or kind.');
  }
  assertDigest(value.digest);
  const inputs = value.inputs as unknown;
  const validated = value.kind === 'rendering' ? renderingIdentity(inputs as RenderingInputs)
    : value.kind === 'comparison' ? comparisonIdentity(inputs as Parameters<typeof comparisonIdentity>[0])
    : reviewIdentity(inputs as Parameters<typeof reviewIdentity>[0]);
  if (validated.digest !== value.digest) throw new Error('Evidence identity does not match its inputs.');
}
