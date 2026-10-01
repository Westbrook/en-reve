import { deepStrictEqual } from 'node:assert';
import { parse } from 'parse5';
import { transform } from 'lightningcss';

const htmlNamespace = 'http://www.w3.org/1999/xhtml';
const whitespace = new Set([' ', '\t', '\n', '\r', '\f']);

function visit(node, callback) {
  callback(node);
  for (const child of node.childNodes ?? []) visit(child, callback);
  if (node.content) visit(node.content, callback);
}

function isCssStyle(node) {
  if (node.tagName !== 'style' || node.namespaceURI !== htmlNamespace) return false;
  const type = node.attrs?.find((attribute) => attribute.name === 'type')?.value.toLowerCase();
  return !type || type === 'text/css';
}

function isWhitespace(source) {
  return source.length > 0 && [...source].every((character) => whitespace.has(character));
}

/** Keep text, comments, attributes and template contents in the comparison. */
function structure(node, inCss = false) {
  return {
    name: node.nodeName,
    namespace: node.namespaceURI,
    attrs: node.attrs,
    value: inCss && node.nodeName === '#text' ? '[minified CSS]' : node.value,
    data: node.data,
    doctype: node.nodeName === '#documentType' ? [node.name, node.publicId, node.systemId] : undefined,
    mode: node.mode,
    children: node.childNodes?.map((child) => structure(child, isCssStyle(node))),
    content: node.content ? structure(node.content) : undefined,
  };
}

/**
 * One build owns one cache; no process-global stylesheet retention.
 * HTML text is never collapsed: inherited white-space and inline gaps are
 * application semantics. Source edits also retain textarea's first newline.
 */
export function createDocumentMinifier() {
  const stylesheets = new Map();

  return function minifyDocument(source, { filename = 'document.html' } = {}) {
    const document = parse(source, { sourceCodeLocationInfo: true });
    const edits = [];
    const report = { inputBytes: Buffer.byteLength(source), outputBytes: 0, syntaxBytesSaved: 0, cssBytesSaved: 0, styleBlocks: 0, cssCacheHits: 0 };

    function compactGap(start, end, replacement) {
      const original = source.slice(start, end);
      if (original !== replacement && isWhitespace(original)) {
        edits.push({ start, end, value: replacement });
        report.syntaxBytesSaved += original.length - replacement.length;
      }
    }

    visit(document, (node) => {
      const location = node.sourceCodeLocation;
      const startTag = location?.startTag;
      if (startTag) {
        let cursor = startTag.startOffset + 1;
        while (cursor < startTag.endOffset && !whitespace.has(source[cursor]) && source[cursor] !== '>' && source[cursor] !== '/') cursor++;
        const attributes = Object.values(location.attrs ?? {}).sort((a, b) => a.startOffset - b.startOffset);
        for (const attribute of attributes) {
          compactGap(cursor, attribute.startOffset, ' ');
          cursor = attribute.endOffset;
        }
        // Preserve slash-adjacent syntax, including the separator needed after
        // unquoted attributes. Unrecognized/malformed gaps stay byte-identical.
        compactGap(cursor, startTag.endOffset - 1, '');
      }
      const endTag = location?.endTag;
      if (endTag) {
        let cursor = endTag.startOffset + 2;
        while (cursor < endTag.endOffset && !whitespace.has(source[cursor]) && source[cursor] !== '>') cursor++;
        compactGap(cursor, endTag.endOffset - 1, '');
      }
      if (!isCssStyle(node) || !startTag || !endTag) return;

      const css = source.slice(startTag.endOffset, endTag.startOffset);
      report.styleBlocks++;
      let compact = stylesheets.get(css);
      if (compact !== undefined) {
        report.cssCacheHits++;
      } else {
        // No targets: retain modern selectors, logical properties and native
        // light-dark(). No symbol pruning, custom-property renaming or recovery.
        compact = transform({ filename: `${filename}#style-${report.styleBlocks}`, code: Buffer.from(css), minify: true }).code.toString();
        if (compact.toLowerCase().includes('</style')) throw new Error(`Minified CSS would close its style element in ${filename}.`);
        // An empty stylesheet still owns a text node when one existed before.
        if (!compact && css) compact = ' ';
        if (Buffer.byteLength(compact) > Buffer.byteLength(css)) compact = css;
        stylesheets.set(css, compact);
      }
      if (compact !== css) {
        edits.push({ start: startTag.endOffset, end: endTag.startOffset, value: compact });
        report.cssBytesSaved += Buffer.byteLength(css) - Buffer.byteLength(compact);
      }
    });

    // Linear assembly avoids copying the complete document for every style/gap.
    edits.sort((a, b) => a.start - b.start);
    const chunks = [];
    let cursor = 0;
    for (const edit of edits) {
      if (edit.start < cursor) throw new Error(`Overlapping document minification edits in ${filename}.`);
      chunks.push(source.slice(cursor, edit.start), edit.value);
      cursor = edit.end;
    }
    chunks.push(source.slice(cursor));
    const html = chunks.join('');
    // Parsing is validation only; never serialize the parsed tree back to HTML.
    deepStrictEqual(structure(parse(html)), structure(document), `Document minification changed HTML semantics in ${filename}.`);
    report.outputBytes = Buffer.byteLength(html);
    return { html, report };
  };
}
