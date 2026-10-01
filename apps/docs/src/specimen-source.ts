import { html as staticHtml, unsafeStatic } from 'lit/static-html.js';
import sources from './generated/specimens.js';

/** Reads the same file the browser executes, preserving bindings and handlers. */
export function sourceFor(id: string): string {
  const source = sources[id];
  if (source === undefined) throw new Error(`Missing authored source for ${id}.`);
  return source;
}

const sourceTemplates = new Map<string, ReturnType<typeof staticHtml>>();

/** Microlighter needs a sole Text child; static escaped source avoids Lit marker comments. */
export function sourceCode(id: string) {
  const existing = sourceTemplates.get(id);
  if (existing) return existing;
  const escaped = sourceFor(id).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  const template = staticHtml`<code class="language-lit-typescript">${unsafeStatic(escaped)}</code>`;
  sourceTemplates.set(id, template);
  return template;
}
