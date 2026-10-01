import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, symlink, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { parseFragment } from 'parse5';
import { transform as minifyCSS } from 'lightningcss';
import { render } from '@lit-labs/ssr';
import { collectResult } from '@lit-labs/ssr/lib/render-result.js';
import { minifyLitTemplates } from './literals.mjs';

const require = createRequire(import.meta.url);
async function evaluate(t, source, minify = true) {
  const directory = await mkdtemp(join(tmpdir(), 'en-lit-minify-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  await mkdir(join(directory, 'node_modules'));
  await symlink(dirname(require.resolve('lit')), join(directory, 'node_modules/lit'), 'dir');
  const id = join(directory, 'fixture.mjs');
  const plugin = minifyLitTemplates({ include: [directory] });
  const result = minify ? await plugin.transform(source, id) : null;
  await writeFile(id, result?.code ?? source);
  return { module: await import(pathToFileURL(id)), result, id };
}
function elements(node, tag) {
  return [ ...(node.tagName === tag ? [node] : []), ...(node.childNodes ?? []).flatMap((child) => elements(child, tag)) ];
}
function text(node) {
  return node.nodeName === '#text' ? node.value : (node.childNodes ?? []).map(text).join('');
}

test('HTML remains renderable with bindings, inline gaps and exact pre/code/textarea text', async (t) => {
  const { module, result, id } = await evaluate(t, `import {html} from 'lit';
    const name='Ada'; const value='an "exact" value';
    export const output=html\`\n      <p title=\${value}>Hello <b>\${name}</b> world.</p>\n      <pre>  a  b\n  c</pre><code><span>  d  e\n f</span></code><textarea>  g  h\n i</textarea>\n    \`;`);
  const fragment = parseFragment(await collectResult(render(module.output)));
  assert.equal(text(elements(fragment, 'p')[0]), 'Hello Ada world.');
  assert.equal(elements(fragment, 'p')[0].attrs.find((attr) => attr.name === 'title').value, 'an "exact" value');
  assert.equal(text(elements(fragment, 'pre')[0]), '  a  b\n  c');
  assert.equal(text(elements(fragment, 'code')[0]), '  d  e\n f');
  assert.equal(text(elements(fragment, 'textarea')[0]), '  g  h\n i');
  assert.ok(result.map.mappings.length > 0);
  assert.deepEqual(result.map.sources.map((name) => resolve(dirname(id), name)), [id]);
});

test('CSS rule, declaration and nested value fragments preserve tokens, strings and escapes', async (t) => {
  const source = String.raw`import {css} from 'lit';
    const inset=css\`  calc(\n  1px +   2px) \`;
    const declaration=css\` margin: \${inset}; \`;
    export const sheet=css\`
      .one, .two {
        \${declaration}
        content: "a  b";
        --escaped: \\31   a;
        color: light-dark(white, black);
      }
      /* keep  this comment */
    \`;
  `.replaceAll('\\`', '`').replaceAll('\\${', '${');
  const { module } = await evaluate(t, source);
  const original = await evaluate(t, source, false);
  const canonical = (sheet) => minifyCSS({ code: Buffer.from(sheet.cssText), minify: true }).code.toString();
  assert.equal(canonical(module.sheet), canonical(original.module.sheet));
  assert.ok(module.sheet.cssText.length < original.module.sheet.cssText.length);
});

test('aliases and namespace tags are transformed; local shadowing and static source wrappers are preserved', async (t) => {
  const { module } = await evaluate(t, `import {html as h} from 'lit';
    import * as lit from 'lit';
    import {html as sourceHtml} from 'lit/static-html.js';
    const capture=(parts)=>parts[0];
    function local(h){return h\`  <b>  local  text  </b>  \`;}
    export const shadowed=local(capture);
    export const ordinary=h\`\n   <b   class="x">  normal  text  </b>\n \`;
    export const namespaced=lit.html\`\n   <i   class="x">  normal  text  </i>\n \`;
    export const source=sourceHtml\`<code>  exact  source\n  text</code>\`;`);
  assert.equal(module.shadowed, '  <b>  local  text  </b>  ');
  assert.equal(module.ordinary.strings[0], ' <b class="x"> normal text </b> ');
  assert.equal(module.namespaced.strings[0], ' <i class="x"> normal text </i> ');
  assert.equal(module.source.strings[0], '<code>  exact  source\n  text</code>');
});

test('explicit whitespace preservation and raw imports remain exact', async (t) => {
  const source = `import {html} from 'lit'; export const output=/* en-preserve-whitespace */html\`<span class="pre">  a  b\n c</span>\`;`;
  const { module } = await evaluate(t, source);
  assert.equal(module.output.strings[0], '<span class="pre">  a  b\n c</span>');
  const plugin = minifyLitTemplates({ include: ['/fixture'] });
  assert.equal(await plugin.transform(source, '/fixture/example.ts?raw'), null);
  assert.equal(await plugin.transform(source, '/elsewhere/example.ts'), null);
  assert.equal(plugin.apply, 'build');
});

test('template escaping survives minification and malformed HTML fails the build', async (t) => {
  const { module } = await evaluate(t, String.raw`import {html} from 'lit';
    export const output=html\`  <p>  \\path \\u0024{literal} \\u0060  </p>  \`;
  `.replaceAll('\\`', '`'));
  assert.equal(text(elements(parseFragment(await collectResult(render(module.output))), 'p')[0]), ' \\path \\u0024{literal} \\u0060 ');
  const plugin = minifyLitTemplates({ include: ['/fixture'] });
  await assert.rejects(() => plugin.transform('import {html} from "lit"; const output=html`<p title="never ends>`;', '/fixture/bad.ts'));
});

test('SVG fragments preserve sibling shapes and expression boundaries through SSR', async (t) => {
  const source = `import {html,svg as shape} from 'lit';import * as lit from 'lit';
    const path='M12 11v6m0-10v1';
    const info=shape\`<circle cx="12" cy="12" r="9" /><path d=\${path} />\`;
    const search=lit.svg\`<circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4 4" />\`;
    export const output=html\`<svg>\${info}</svg><svg>\${search}</svg>\`;`;
  for (const compact of [false,true]) {
    const {module}=await evaluate(t,source,compact);
    const svgs=elements(parseFragment(await collectResult(render(module.output))),'svg');
    assert.equal(svgs.length,2);
    for(const svg of svgs){
      const shapes=svg.childNodes.filter(node=>node.tagName);
      assert.deepEqual(shapes.map(node=>node.tagName),['circle','path']);
      assert.equal(shapes[0].childNodes.length,0);
      assert.equal(shapes[1].namespaceURI,'http://www.w3.org/2000/svg');
    }
    assert.equal(svgs[0].childNodes.find(node=>node.tagName==='path').attrs.find(attr=>attr.name==='d').value,'M12 11v6m0-10v1');
  }
});

test('native table fragments retain their exact parent context and sibling structure', async t => {
  const source = `import {html} from 'lit';
    const col=width=>html\` <col style=\${'width:'+width}> \`;
    const cell=value=>html\` <td>\${value}</td><td>Other</td> \`;
    const row=value=>html\` <tr><th scope="row">\${value}</th>\${cell(value)}</tr> \`;
    const head=html\` <thead><tr><th>A</th><th>B</th><th>C</th></tr></thead> \`;
    const body=html\` <tbody>\${row('one')}\${row('two')}</tbody> \`;
    const foot=html\` <tfoot><tr><td colspan="3">Total</td></tr></tfoot> \`;
    const caption=html\` <caption>Native content</caption> \`;
    const cols=html\` <colgroup>\${col('40%')}\${col('30%')}\${col('30%')}</colgroup> \`;
    export const output=html\`<table>\${caption}\${cols}\${head}\${body}\${foot}</table>\`;
  `;
  for (const compact of [false,true]) {
    const {module}=await evaluate(t,source,compact);
    const tree=parseFragment(await collectResult(render(module.output)));
    const table=elements(tree,'table')[0];
    assert.deepEqual(table.childNodes.filter(n=>n.tagName).map(n=>n.tagName),['caption','colgroup','thead','tbody','tfoot']);
    assert.equal(elements(tree,'colgroup').length,1);
    assert.equal(elements(tree,'col').length,3);
    assert.equal(elements(tree,'tr').length,4);
    for(const row of elements(elements(tree,'tbody')[0],'tr'))assert.deepEqual(row.childNodes.filter(n=>n.tagName).map(n=>n.tagName),['th','td','td']);
    assert.equal(text(elements(tree,'caption')[0]),'Native content');
  }
});

test('adjacent element directives retain distinct expression holes and order', async (t) => {
  const source = "import {html} from 'lit'; const first = () => {}; const second = () => {}; export const template = html`<section ${first} ${second} class=\"surface\"><span>${'body'}</span></section>`;";
  const original = await evaluate(t, source, false);
  const compacted = await evaluate(t, source);
  assert.equal(compacted.module.template.values.length, 3);
  assert.equal(compacted.module.template.values[0].name, 'first');
  assert.equal(compacted.module.template.values[1].name, 'second');
  assert.equal(compacted.module.template.values[2], 'body');
  assert.deepEqual(compacted.module.template.strings, original.module.template.strings);
});


test('nonbreaking spaces retain adjacent word gaps, repeated spaces and expression boundaries', async (t) => {
  const source = "import {html} from 'lit'; const value='bound'; export const output=html`<p   class=\"spacing\">A &nbsp; B</p><p>A &#8239; B</p><p>A &numsp; B</p><p>A \u00a0 B</p><p>A \u202f B</p><p>A \u2007 B</p><p>A &nbsp;&nbsp; B</p><p>A &nbsp; ${value} &nbsp; B</p>`;";
  const expected = ['A \u00a0 B', 'A \u202f B', 'A \u2007 B', 'A \u00a0 B', 'A \u202f B', 'A \u2007 B', 'A \u00a0\u00a0 B', 'A \u00a0 bound \u00a0 B'];
  for (const compact of [false, true]) {
    const { module, result } = await evaluate(t, source, compact);
    if (compact) {
      assert.ok(result, 'the fixture must exercise the minifier');
      assert.notEqual(result.code, source);
    }
    const tree = parseFragment(await collectResult(render(module.output)));
    assert.deepEqual(elements(tree, 'p').map(text), expected);
  }
});
