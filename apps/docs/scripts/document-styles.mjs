import { readFile, realpath, stat } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { parse } from 'parse5';
import { transform } from 'lightningcss';

const allowedAttributes = new Set(['rel', 'href', 'media', 'type', 'crossorigin', 'nonce']);
const retainedAttributes = new Set(['media', 'type', 'nonce']);

function assertWithin(root, path) {
  const local = relative(root, path);
  if (local === '..' || local.startsWith(`..${sep}`) || isAbsolute(local)) {
    throw new Error(`Document stylesheet must stay inside the build output: ${path}`);
  }
}

/** One build owns the read/validation cache; only active head links are rewritten. */
export function createDocumentStylesInliner({ outputRoot, base = '/' }) {
  const root = resolve(outputRoot);
  const stylesheets = new Map();
  let actualRoot;

  async function stylesheet(path) {
    if (!stylesheets.has(path)) {
      stylesheets.set(path, (async () => {
        actualRoot ??= await realpath(root);
        const actualPath = await realpath(path);
        assertWithin(actualRoot, actualPath);
        const css = await readFile(actualPath, 'utf8');
        if (css.toLowerCase().includes('</style')) {
          throw new Error(`Document stylesheet cannot close its inline style element: ${path}`);
        }
        // Parse dependencies without using transformed output. Only the docs'
        // root-relative reference font URLs retain identical inline semantics;
        // imports and other URL forms still require an explicit delivery design.
        const { dependencies } = transform({ filename: path, code: Buffer.from(css), analyzeDependencies: true });
        for (const dependency of dependencies ?? []) {
          if (dependency.type !== 'url' || !/^\/fonts\/theme-references\/[A-Za-z0-9_-]+\.woff2$/.test(dependency.url.startsWith(base) ? '/' + dependency.url.slice(base.length) : dependency.url)) {
            throw new Error(`Cannot inline document stylesheet with unsupported url() or @import dependencies: ${path}`);
          }
          const asset = await realpath(resolve(root, `.${dependency.url.startsWith(base) ? '/' + dependency.url.slice(base.length) : dependency.url}`));
          assertWithin(actualRoot, asset);
          if (!(await stat(asset)).isFile()) throw new Error(`Document font asset must be a file: ${dependency.url}`);
        }
        return css;
      })());
    }
    return stylesheets.get(path);
  }

  return async function inlineDocumentStyles(source, { filename = 'index.html' } = {}) {
    const documentPath = resolve(root, filename);
    assertWithin(root, documentPath);
    const document = parse(source, { sourceCodeLocationInfo: true });
    const html = document.childNodes.find(node => node.tagName === 'html');
    const head = html?.childNodes.find(node => node.tagName === 'head');
    if (!head) throw new Error(`Document styles require a head: ${filename}`);
    if (head.childNodes.some(node => node.tagName === 'base' && node.attrs.some(attr => attr.name === 'href'))) {
      throw new Error(`Document stylesheet inlining does not support a base href: ${filename}`);
    }
    const edits = [];
    for (const link of head.childNodes.filter(node => node.tagName === 'link')) {
      const attrs = new Map(link.attrs.map(attr => [attr.name, attr.value]));
      const rel = (attrs.get('rel') ?? '').toLowerCase().split(/\s+/u).filter(Boolean);
      if (!rel.includes('stylesheet')) continue;
      if (rel.length !== 1 || link.attrs.some(attr => !allowedAttributes.has(attr.name))
        || (attrs.has('type') && attrs.get('type').trim().toLowerCase() !== 'text/css' && attrs.get('type').trim() !== '')) {
        throw new Error(`Unsupported document stylesheet link attributes in ${filename}: ${attrs.get('href') ?? '(missing href)'}`);
      }
      const href = attrs.get('href') ?? '';
      if (!href || /^(?:[a-z][a-z\d+.-]*:|\/\/)/iu.test(href) || /[\\\u0000-\u0020]/u.test(href)) {
        throw new Error(`Document stylesheet must use a local output path in ${filename}: ${href}`);
      }
      let pathname;
      try { pathname = decodeURIComponent(href.split(/[?#]/u, 1)[0]); }
      catch { throw new Error(`Invalid document stylesheet URL in ${filename}: ${href}`); }
      if (!pathname || /[\\\u0000]/u.test(pathname) || pathname.startsWith('//')) {
        throw new Error(`Invalid document stylesheet path in ${filename}: ${href}`);
      }
      if (base !== '/' && pathname.startsWith(base)) pathname = '/' + pathname.slice(base.length);
      const path = pathname.startsWith('/')
        ? resolve(root, `.${pathname}`)
        : resolve(dirname(documentPath), pathname);
      assertWithin(root, path);
      const css = await stylesheet(path);
      const location = link.sourceCodeLocation;
      if (!location) throw new Error(`Document stylesheet is missing source offsets: ${filename}`);
      // Keep original attribute spelling/escaping, media conditions and source
      // order. Duplicate text stays: intervening rules/layers can affect cascade.
      const preserved = link.attrs.filter(attr => retainedAttributes.has(attr.name)).map(attr => {
        const offset = location.attrs[attr.name];
        return ` ${source.slice(offset.startOffset, offset.endOffset)}`;
      }).join('');
      edits.push({ start: location.startOffset, end: location.endOffset, value: `<style${preserved}>${css}</style>` });
    }
    // Source edits never reserialize the body or its hydrated Lit/DSD templates.
    return edits.sort((a, b) => b.start - a.start).reduce((result, edit) =>
      result.slice(0, edit.start) + edit.value + result.slice(edit.end), source);
  };
}
