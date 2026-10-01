import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { parse } from 'parse5';
import { createDocumentMinifier } from './document.mjs';

function descendants(node) {
  return [node, ...(node.childNodes ?? []).flatMap(descendants), ...(node.content ? descendants(node.content) : [])];
}
function element(document, id) {
  return descendants(document).find((node) => node.attrs?.some((attribute) => attribute.name === 'id' && attribute.value === id));
}
function text(node) {
  return (node.childNodes ?? []).map((child) => child.nodeName === '#text' ? child.value : text(child)).join('');
}

test('compacts tag syntax while preserving text, markers, raw source and attribute values', () => {
  const source = `<!doctype html><html><head><style>p { white-space: pre-wrap; }</style></head><body>
    <!--lit-part digest--><x-inline\n title = "a  > b &amp; c"\t data-value='one  two' >one</x-inline > <x-inline>two</x-inline><!--/lit-part-->
    <p id="inherited">  first\n\tsecond  </p>
    <pre id="code"><code>\tif (a &lt; b) {\n  next();\n}</code></pre>
    <textarea id="editor">\n\n\tstart  end\n</textarea>
    <input id="slash" value=word/ >
    <input id="separator" value=word />
    <div id="duplicate" title="first"\n title="second" >text</div>
    <template shadowrootmode="open"><!--lit-part inner--><span\n class="example" >one</span> <span>two</span><!--/lit-part--></template>
    <svg viewBox="0 0 10 10"><path\n d="M 0 0 L 1 1" /></svg>
  </body></html>`;
  const minify = createDocumentMinifier();
  const result = minify(source);
  const tree = parse(result.html);
  assert.ok(result.report.syntaxBytesSaved > 0);
  assert.equal(text(element(tree, 'inherited')), '  first\n\tsecond  ');
  assert.equal(text(element(tree, 'code')), '\tif (a < b) {\n  next();\n}');
  assert.equal(text(element(tree, 'editor')), '\n\tstart  end\n');
  assert.equal(element(tree, 'slash').attrs.find((attribute) => attribute.name === 'value').value, 'word/');
  assert.equal(element(tree, 'separator').attrs.find((attribute) => attribute.name === 'value').value, 'word');
  assert.deepEqual(descendants(tree).filter((node) => node.nodeName === '#comment').map((node) => node.data), ['lit-part digest', '/lit-part', 'lit-part inner', '/lit-part']);
  assert.equal(minify(result.html).html, result.html);
});

test('retains empty CSS nodes and skips non-CSS and foreign style text', () => {
  const source = '<!doctype html><html><head><style>/* nothing */</style><style></style><style type="text/plain">  literal\n text  </style></head><body><svg><style>  .icon { fill: red; }  </style></svg></body></html>';
  const { html, report } = createDocumentMinifier()(source);
  assert.equal(report.styleBlocks, 2);
  const styles = descendants(parse(html)).filter((node) => node.tagName === 'style');
  assert.equal(text(styles[2]), '  literal\n text  ');
  assert.equal(text(styles[3]), '  .icon { fill: red; }  ');
});

test('shares repeated stylesheet work only inside the owning minifier instance', () => {
  const source = '<!doctype html><style>p { color: red; }</style><div><template shadowrootmode="open"><style>p { color: red; }</style></template></div>';
  const minify = createDocumentMinifier();
  assert.equal(minify(source).report.cssCacheHits, 1);
  assert.equal(minify(source).report.cssCacheHits, 2);
  assert.equal(createDocumentMinifier()(source).report.cssCacheHits, 1);
});

test('fails on invalid generated CSS instead of recovering by dropping rules', () => {
  assert.throws(() => createDocumentMinifier()('<!doctype html><style>p { color: "unterminated\n</style>'));
});
