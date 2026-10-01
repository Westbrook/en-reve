import { fileURLToPath } from 'node:url';
import { resolve, sep } from 'node:path';
import { minify } from 'html-minifier-next';
import MagicString from 'magic-string';
import {ts} from '../metadata/compiler-api.mjs';

// The explicit JavaScript compiler API parses source; TypeScript 7 remains the
// package build compiler. No upstream plugin or fallback compiler is loaded.
const htmlModules = new Set(['lit', 'lit-html', 'lit-html/lit-html.js', 'lit-element', 'lit-element/lit-element.js']);
const cssModules = new Set(['lit', 'lit-element', 'lit-element/lit-element.js', '@lit/reactive-element', '@lit/reactive-element/css-tag.js']);
const preserveComment = /\/\*\s*en-preserve-whitespace\s*\*\//;

function matches(rule, id) {
  if (typeof rule === 'function') return rule(id);
  if (rule instanceof RegExp) {
    rule.lastIndex = 0;
    return rule.test(id);
  }
  const path = resolve(rule instanceof URL ? fileURLToPath(rule) : rule);
  return id === path || id.startsWith(path.endsWith(sep) ? path : path + sep);
}

function sourceTemplates(source, { fileName }) {
  const root = ts.createSourceFile(fileName, source, ts.ScriptTarget.ESNext, true);
  const host = {
    getSourceFile: (name) => name === fileName ? root : undefined,
    getDefaultLibFileName: () => '', writeFile() {}, getCurrentDirectory: () => '',
    getDirectories: () => [], fileExists: (name) => name === fileName,
    readFile: (name) => name === fileName ? source : undefined,
    getCanonicalFileName: (name) => name, useCaseSensitiveFileNames: () => true,
    getNewLine: () => '\n',
  };
  const program = ts.createProgram([fileName], { noResolve: true, noLib: true, allowJs: true, target: ts.ScriptTarget.ESNext }, host);
  const checker = program.getTypeChecker();
  const result = [];
  function visit(node) {
    if (ts.isTaggedTemplateExpression(node)) {
      let identifier = node.tag;
      let exported;
      const memberTag = ts.isPropertyAccessExpression(identifier);
      if (ts.isPropertyAccessExpression(identifier) && ts.isIdentifier(identifier.expression)) {
        exported = identifier.name.text;
        identifier = identifier.expression;
      }
      const declaration = ts.isIdentifier(identifier)
        ? checker.getSymbolAtLocation(identifier)?.declarations?.[0]
        : undefined;
      let specifier;
      if (!memberTag && declaration && ts.isImportSpecifier(declaration) && !declaration.isTypeOnly && !declaration.parent.parent.isTypeOnly) {
        exported = declaration.propertyName?.text ?? declaration.name.text;
        specifier = declaration.parent.parent.parent.moduleSpecifier.text;
      } else if (memberTag && declaration && ts.isNamespaceImport(declaration) && !declaration.parent.isTypeOnly) {
        specifier = declaration.parent.parent.moduleSpecifier.text;
      }
      const html = (exported === 'html' || exported === 'svg') && htmlModules.has(specifier);
      const css = exported === 'css' && cssModules.has(specifier);
      // lit/static-html is intentionally excluded: the docs insert exact escaped
      // source into its literal strings. A comment also protects CSS-driven pre
      // formatting that an HTML parser cannot infer from external stylesheets.
      const preserved = preserveComment.test(source.slice(node.getFullStart(), node.tag.end));
      if ((html || css) && !preserved) {
        const template = node.template;
        const literals = ts.isNoSubstitutionTemplateLiteral(template)
          ? [template]
          : [template.head, ...template.templateSpans.map((span) => span.literal)];
        const parts = literals.map((literal, index) => ({
          text: literal.text,
          start: literal.getStart(root) + 1,
          end: literal.end - (index < literals.length - 1 ? 2 : 1),
        }));
        result.push({ tag: css ? 'css' : 'html', parts });
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(root);
  return result;
}

// A CSS template can be a stylesheet, rule list, declaration list, selector or
// value fragment. The full stylesheet optimizer cannot safely parse arbitrary
// expression holes. Only collapse whitespace tokens here; preserve every token,
// comment, string and escape (including a hexadecimal escape's terminator).
function compactCSS(css) {
  let result = '';
  for (let i = 0; i < css.length;) {
    const char = css[i];
    if (char === '"' || char === "'") {
      const quote = char;
      result += char;
      i++;
      while (i < css.length) {
        const next = css[i++];
        result += next;
        if (next === '\\' && i < css.length) result += css[i++];
        else if (next === quote) break;
      }
    } else if (char === '/' && css[i + 1] === '*') {
      const end = css.indexOf('*/', i + 2);
      if (end < 0) throw new Error('Unclosed CSS comment in a Lit template.');
      result += css.slice(i, end + 2);
      i = end + 2;
    } else if (char === '\\') {
      result += char;
      i++;
      if (/[\da-f]/i.test(css[i] ?? '') && i < css.length) {
        let count = 0;
        while (i < css.length && count++ < 6 && /[\da-f]/i.test(css[i])) result += css[i++];
        // Keep the terminator and any following separator: combining the two
        // would turn a descendant selector into one escaped identifier.
        while (i < css.length && /[\t\n\f\r ]/.test(css[i])) result += css[i++];
      } else if (i < css.length) {
        result += css[i++];
        if (css[i - 1] === '\r' && css[i] === '\n') result += css[i++];
      }
    } else if (/[\t\n\f\r ]/.test(char)) {
      result += ' ';
      do { i++; } while (i < css.length && /[\t\n\f\r ]/.test(css[i]));
    } else {
      result += char;
      i++;
    }
  }
  return result;
}

function escapePart(part) {
  return part.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
}

const strategy = {
  getPlaceholder(parts) {
    let placeholder = 'enreveexpressionplaceholder';
    while (parts.some((part) => part.text.includes(placeholder))) placeholder += 'x';
    return placeholder;
  },
  // Distinct holes are essential: HTML parsers discard repeated bare attributes.
  combineHTMLStrings: (parts, placeholder) => parts.map((part, index) =>
    `${index ? `${placeholder}${index - 1}${placeholder}` : ''}${part.text}`).join(''),
  async minifyHTML(html, options) {
    // The minifier repairs context-free table leaves (notably col) by inserting
    // groups. Supply the native parent context, then remove only our wrappers.
    const tag = /^\s*(?:<!--[\s\S]*?-->\s*)*<([\w-]+)\b/i.exec(html)?.[1]?.toLowerCase();
    const contexts = {col:['table','colgroup'], tr:['table','tbody'], td:['table','tbody','tr'], th:['table','tbody','tr'],
      caption:['table'], colgroup:['table'], thead:['table'], tbody:['table'], tfoot:['table']};
    const context = contexts[tag] ?? [];
    const before = context.map(tag => `<${tag}>`).join('');
    const after = [...context].reverse().map(tag => `</${tag}>`).join('');
    const result = await minify(before + html + after, { ...options, minifyCSS: false });
    if (!context.length) return result;
    if (!result.startsWith(before) || !result.endsWith(after)) throw new Error('Table fragment minification changed its parsing context.');
    return result.slice(before.length, -after.length);
  },
  minifyCSS: compactCSS,
  splitHTMLByPlaceholder(text, placeholder) {
    let index = 0;
    const marker = new RegExp(`${placeholder}(\\d+)${placeholder}`, 'g');
    for (const match of text.matchAll(marker)) {
      if (Number(match[1]) !== index++) throw new Error('Template expression order changed during minification.');
    }
    return text.split(new RegExp(`${placeholder}\\d+${placeholder}`, 'g')).map(escapePart);
  },
};

/**
 * Production-only Vite/Rollup-compatible transform. Include is an explicit list
 * of absolute directory/file roots, URL roots, RegExp objects, or predicates.
 * Install this same plugin with the same include rules in client and SSR builds.
 */
export function minifyLitTemplates({ include, exclude = [] } = {}) {
  const included = Array.isArray(include) ? include : [include];
  const excluded = Array.isArray(exclude) ? exclude : [exclude];
  if (!included.length || included.some((rule) => !rule)) throw new Error('minifyLitTemplates requires an explicit include scope.');
  return {
    name: 'en-reve-minify-lit-templates',
    apply: 'build',
    enforce: 'pre',
    async transform(source, id) {
      // Raw examples, Vite virtual modules and asset queries must remain exact.
      if (id.includes('?') || id.includes('\0') || !/\.[cm]?[jt]sx?$/.test(id)) return null;
      if (!included.some((rule) => matches(rule, id)) || excluded.some((rule) => matches(rule, id))) return null;
      const minifyOptions = {
          // SVG tagged literals may be fragments without an outer <svg>.
          // Dropping their slashes nests subsequent paths inside circle/rect nodes.
          keepClosingSlash: true,
          caseSensitive: true,
          collapseWhitespace: true,
          conservativeCollapse: true,
          collapseInlineTagWhitespace: false,
          // Preserve authored spacing around nonbreaking spaces.
          collapseNoBreakSpaces: false,
          // Native pre/textarea preservation is built in. Code formatting can
          // depend on external CSS, so preserve its literal content explicitly.
          ignoreCustomFragments: [/<code\b[^>]*>[\s\S]*?<\/code\s*>/gi],
          removeComments: false,
          removeAttributeQuotes: false,
          removeEmptyAttributes: false,
          removeDefaultTypeAttributes: false,
          decodeEntities: false,
          minifyJS: false,
          minifyCSS: {},
          useShortDoctype: true,
      };
      const editor = new MagicString(source);
      for (const {tag, parts} of sourceTemplates(source, {fileName: id})) {
        const placeholder = strategy.getPlaceholder(parts);
        const joined = strategy.combineHTMLStrings(parts, placeholder);
        const compact = tag === 'css'
          ? strategy.minifyCSS(joined)
          : await strategy.minifyHTML(joined, minifyOptions);
        const replacement = strategy.splitHTMLByPlaceholder(compact, placeholder);
        if (replacement.length !== parts.length) throw new Error('Template expression count changed during minification.');
        for (let index = 0; index < parts.length; index++) {
          const {start, end} = parts[index];
          // Expression-only boundaries have no source text to overwrite.
          if (start < end) editor.overwrite(start, end, replacement[index]);
        }
      }
      const code = editor.toString();
      return code === source ? null : {
        code,
        map: editor.generateMap({file: `${id}.map`, source: id, hires: true}),
      };
    },
  };
}
