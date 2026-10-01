import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveTheme, restoreDerived, densityNames, componentSizes} from '../dist/index.js';

const dimension = value => ({value,unit:'rem'});
const value = (theme,id) => theme.tokens[id].value;

test('comparable controls share metrics across color, density, rhythm, and size contexts', () => {
  for (const mode of ['light','dark']) for (const density of densityNames) for (const rhythm of [.125,.25,.5]) {
    const theme = resolveTheme({mode,density,pins:{'rhythm.base':dimension(rhythm)}});
    for (const metric of ['family','size','line-height']) {
      assert.deepEqual(value(theme,`font.input.${metric}`),value(theme,`font.ui.${metric}`));
      assert.deepEqual(value(theme,`font.label-strong.${metric}`),value(theme,`font.ui.${metric}`));
      assert.deepEqual(theme.dependencies[`font.input.${metric}`],[`font.ui.${metric}`]);
    }
    for (const size of componentSizes) {
      const expected = dimension(size === 'large' ? 1.125 : 1);
      assert.deepEqual(value(theme,`font.ui.size-${size}`),expected);
      assert.deepEqual(value(theme,`font.input.size-${size}`),expected);
    }
    assert.equal(value(theme,'font.ui.line-height'),1.5);
    assert.equal(value(theme,'font.ui.weight'),400);
    assert.equal(value(theme,'font.input.weight'),400);
    assert.equal(value(theme,'font.label-strong.weight'),600);
  }
});

test('coordinated UI edits propagate while semantic role pins and independent weights remain authoritative', () => {
  const shared = {'font.ui.family':['serif'],'font.ui.size':dimension(1.125),'font.ui.line-height':1.75,'font.ui.weight':500};
  const inherited = resolveTheme({pins:shared});
  for (const role of ['input','label-strong']) for (const metric of ['family','size','line-height']) {
    assert.deepEqual(value(inherited,`font.${role}.${metric}`),value(inherited,`font.ui.${metric}`));
  }
  assert.equal(value(inherited,'font.input.weight'),400);
  assert.equal(value(inherited,'font.label-strong.weight'),600);

  const pins = {...shared,'font.input.size':dimension(1.25),'font.input.family':['monospace'],'font.input.line-height':1.8};
  const independent = resolveTheme({pins});
  assert.deepEqual(value(independent,'font.input.size-small'),dimension(1.25));
  assert.deepEqual(value(independent,'font.input.size-large'),dimension(1.40625));
  assert.deepEqual(value(independent,'font.ui.size'),dimension(1.125));
  assert.deepEqual(value(independent,'font.label-strong.family'),['serif']);
  assert.equal(value(independent,'font.input.line-height'),1.8);
  assert.equal(value(independent,'font.ui.line-height'),1.75);
  const restored = resolveTheme({pins:restoreDerived(pins,'font.input.size')});
  assert.deepEqual(value(restored,'font.input.size-small'),dimension(1.125));
  assert.deepEqual(value(restored,'font.input.family'),['monospace']);
});

test('small control typography preserves its base while geometry and explicit output pins remain independent', () => {
  const pins = {'size.scale-small':.5,'size.type-scale-small':.5};
  const theme = resolveTheme({pins});
  assert.deepEqual(value(theme,'size.control-small'),dimension(1.25));
  assert.deepEqual(value(theme,'font.ui.size-small'),dimension(1));
  assert.deepEqual(value(theme,'font.input.size-small'),dimension(1));
  assert.deepEqual(value(theme,'font.metadata.size-small'),dimension(.8125));
  assert.deepEqual(value(theme,'font.data.size-small'),dimension(.4375));
  const explicit = {...pins,'font.input.size-small':dimension(.875)};
  assert.deepEqual(value(resolveTheme({pins:explicit}),'font.input.size-small'),dimension(.875));
  assert.deepEqual(value(resolveTheme({pins:restoreDerived(explicit,'font.input.size-small')}),'font.input.size-small'),dimension(1));
});
