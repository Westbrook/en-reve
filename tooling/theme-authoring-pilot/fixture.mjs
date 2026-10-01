import { readFile } from 'node:fs/promises';
import { css, unsafeCSS } from 'lit';
import { roles, roleArguments, baselineStyles } from './fixtures/baseline.ts';
import { token } from '../../packages/styles/dist/internal/values.js';
import { sizedStyles } from '../../packages/styles/dist/internal/sizing.js';
import { compile, canonicalCSS } from './compiler.mjs';
import manifest from './manifest.json' with { type: 'json' };

export async function definitionInputs(root = new URL('./', import.meta.url), paths = manifest.definitions) {
  return Promise.all(paths.map(async path => ({ filename: path, css: await readFile(new URL(path, root), 'utf8') })));
}
export function consumerSource() {
  const type = roles.map(role => `.en-${role} { @apply --pilot-typography(${roleArguments(role).map(v => v.cssText).join(', ')}); }`).join('\n');
  return `${type}\n.pilot-inner, .pilot-badge { border-radius: --pilot-inset-radius(${token('--en-radius-container').cssText}, ${token('--en-space-2').cssText}); }`;
}
export function compilePilot(inputs, engine) {
  const consumer = consumerSource();
  const compiled = compile(inputs, consumer, engine, 'typography-and-radius.css');
  // Keep the existing size-role adapter unchanged on both paths.
  const after = canonicalCSS(sizedStyles(css`${unsafeCSS(compiled.css)}`).cssText);
  return { after, consumer, compiled };
}

export function makeComparison(inputs, engine) {
  return { before: canonicalCSS(baselineStyles().cssText), ...compilePilot(inputs, engine) };
}
