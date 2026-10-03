import {ts} from '../../../tooling/metadata/compiler-api.mjs';
import MagicString from 'magic-string';
import {parse} from 'parse5';

export function deploymentBase(value = '/') {
  if (!/^\/(?:[a-zA-Z0-9_-]+\/)*$/.test(value)) throw new Error('Docs base must be an absolute, trailing-slash path.');
  return value;
}
// Only documentation routes/assets. Editor slash commands and arbitrary domain
// strings must never become URL rewrites. The client and SSR use this same pass.
const route = /^\/(?:index\.html|api-examples|api-reference|workflows|reviews|guides|showcase|conversation|theme-[\w-]+|component-patterns|rich-capabilities|document-scroll|review-build\.json|impact\.json|custom-elements\.json|public-api\.json|public-types\.json|favicon\.(?:png|svg)|fonts|styles|images|assets)(?=[/.?#]|$)/;
export function deploymentURL(value, base) {
  if (base === '/' || value.startsWith(base)) return value;
  return route.test(value) || /^\/[?#]/.test(value) ? base + value.slice(1) : value;
}
export function deploymentMarkup(source, base) {
  if (base === '/') return source;
  return source.replace(/\b(href|src|action|poster)=(['"])(\/[^'"\s]*)\2/g, (all, attr, quote, value) => {
    const next = value === '/' ? base : deploymentURL(value, base);
    return `${attr}=${quote}${next}${quote}`;
  });
}
export function deploymentSource(source, filename, base) {
  if (base === '/') return null;
  const ast = ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true);
  if (ast.parseDiagnostics.length) throw new Error('Invalid documentation source: ' + filename);
  const output = new MagicString(source);
  function visit(node) {
    if (ts.isStringLiteral(node)) {
      let next = deploymentURL(node.text, base);
      // A root path needs an explicit URL context; '/' is also an editor trigger.
      const parent = node.parent;
      const rootURL = node.text === '/' && (
        ts.isCallExpression(parent) && /(?:href|pageHref)$/.test(parent.expression.getText(ast)) ||
        ts.isPropertyAssignment(parent) && parent.name.getText(ast) === 'path');
      if (rootURL) next = base;
      if (next !== node.text) output.overwrite(node.getStart(ast), node.end, JSON.stringify(next));
      return;
    }
    if (ts.isTemplateLiteralToken(node)) {
      const start = node.getStart(ast), raw = source.slice(start, node.end);
      let next = deploymentMarkup(raw, base);
      // Prefix literal URL heads such as `/api-examples/${id}`; never `/${tool}`.
      next = next.replace(/^`(\/[^`$]*)/, (all, value) => '`' + deploymentURL(value, base));
      if (next !== raw) output.overwrite(start, node.end, next);
      return;
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
  return output.hasChanged() ? {code:output.toString(),map:output.generateMap({hires:true,source:filename,includeContent:true})} : null;
}
export function deploymentPaths(base = deploymentBase(process.env.EN_DOCS_BASE_PATH)) {
  return {name:'en-docs-deployment-paths',enforce:'pre',
    transform(code,id){return /\/apps\/docs\/src\/.*\.[cm]?[jt]s$/.test(id.split('?')[0]) ? deploymentSource(code,id,base) : null;},
    transformIndexHtml:{order:'pre',handler:html=>base === '/' ? html : {html:deploymentMarkup(html,base),tags:[{tag:'script',attrs:{type:'module',src:'/src/deployment-fragments.ts'},injectTo:'head'}]}},
  };
}

/** Bind every HTML document before its review-build transport hash is sealed. */
export function deploymentDocument(source, filename, base) {
  if (base === '/') return source;
  const tree = parse(source, {sourceCodeLocationInfo:true});
  const output = new MagicString(source);
  let head;
  function visit(node) {
    if (node.tagName === 'head') head = node;
    if (node.tagName === 'base') throw new Error('Base is owned by documentation deployment finalization.');
    for (const attr of node.attrs ?? []) {
      if (!['href','src','action','poster'].includes(attr.name)) continue;
      const value = attr.value;
      const next = value.startsWith('#') && attr.name === 'href'
        ? base + filename + value
        : value === '/' ? base : deploymentURL(value, base);
      const loc = node.sourceCodeLocation?.attrs?.[attr.name];
      if (next !== value && loc) output.overwrite(loc.startOffset, loc.endOffset,
        attr.name + '="' + next.replaceAll('&','&amp;').replaceAll('"','&quot;') + '"');
    }
    for (const child of node.childNodes ?? []) visit(child);
    if (node.content) visit(node.content);
  }
  visit(tree);
  if (!head?.sourceCodeLocation?.startTag) throw new Error('Missing explicit document head: '+filename);
  output.appendLeft(head.sourceCodeLocation.startTag.endOffset,
    '<base href="https://westbrook.github.io'+base+'">');
  return output.toString();
}
