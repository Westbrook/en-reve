#!/usr/bin/env python3
"""Prepared major-family Radix anatomy mapping. Coordinator review required.

Apply radix-update.py --presentations first, then this script after registering
the shared display/feedback/navigation, source-shapes, astryx and radix modules.
No builds, generated output, component behavior or other themes are modified.
Importing this module performs no I/O. update(definition) is the pure default-tab
delta; apply_anatomy(definition) retains the broader prepared anatomy transform.
Only explicit CLI execution reads or writes the catalogue.
"""
import argparse
from copy import deepcopy
import json
from pathlib import Path

def color(h):
    h = h.removeprefix('#')
    c = {'colorSpace': 'srgb', 'components': [int(h[i:i+2], 16)/255 for i in (0, 2, 4)]}
    if len(h) == 8:
        c['alpha'] = int(h[6:8], 16)/255
    return c

def alpha(a):
    return {'colorSpace': 'srgb', 'components': [0, 0, 0], 'alpha': a}

def dim(v):
    return {'value': v, 'unit': 'px'}

def t(kind, value):
    return {'$type': kind, '$value': value}

def shadow(c, y=0, blur=0, spread=0, x=0, inset=False):
    s = {'color': c, 'offsetX': dim(x), 'offsetY': dim(y), 'blur': dim(blur), 'spread': dim(spread)}
    if inset:
        s['inset'] = True
    return s

def role(name):
    return f'theme.radix.anatomy.{name}'

def update(definition):
    """Return a copy with only selected tracking and default tab/list roles changed."""
    if definition.get('id') != 'radix-inspired':
        raise ValueError('Expected the radix-inspired definition')
    result = deepcopy(definition)
    for mode in ('light', 'dark'):
        anatomy = result['baseOptions'][mode]['source']['theme']['radix']['anatomy']
        # These existing literals are shared source dimensions; do not rewrite them.
        if anatomy['d0'] != {'$type': 'dimension', '$value': {'value': 0, 'unit': 'px'}} or anatomy['d40'] != {'$type': 'dimension', '$value': {'value': 40, 'unit': 'px'}}:
            raise ValueError('Expected existing Radix 0px/40px source anatomy tokens')
        anatomy['tab-selected-tracking'] = {'$type': 'number', '$value': -.01}
    rules = result['companion']['rules']
    rules[:] = [rule for rule in rules if rule['target'] not in ('tabs', 'tab-list')]
    matches = [index for index, rule in enumerate(rules) if rule['target'] == 'tab' and rule.get('presentation') == 'line']
    if len(matches) != 1:
        raise ValueError('Expected exactly one existing Radix line-tab presentation')
    index = matches[0]
    rules[index]['roles']['minBlockSize'] = 'theme.radix.anatomy.d40'
    rules[index]['roles']['selectedTracking'] = 'theme.radix.anatomy.tab-selected-tracking'
    rules[index:index] = [
        {'target': target, 'presentation': 'line', 'tokens': {}, 'roles': {'gap': 'theme.radix.anatomy.d0'}}
        for target in ('tabs', 'tab-list')
    ]
    return result


def apply_anatomy(definition):
    """Return the complete former CLI anatomy proposal without I/O or input mutation."""
    if definition.get('id') != 'radix-inspired':
        raise ValueError('Expected the radix-inspired definition')
    d = deepcopy(definition)
    def rule(target, presentation, roles, tokens=None):
        # Only these Radix target mappings are replaced; buttons/other theme rules stay intact.
        rules = d['companion']['rules']
        rules[:] = [old for old in rules if old['target'] != target or old.get('variant')]
        rules.append({'target': target, 'presentation': presentation, 'tokens': tokens or {}, 'roles': roles})

    for mode in ('light', 'dark'):
        base = d['baseOptions'][mode]
        source = base['source']['theme']['radix'].setdefault('anatomy', {})
        for n in (0, 1, 2, 4, 5, 6, 8, 12, 14, 16, 18, 20, 22, 24, 28, 32, 35, 40, 42, 48, 64, 480, 600):
            source[f'd{n}'] = t('dimension', dim(n))
        source['radio-dot'] = t('dimension', dim(6.4))
        source['white'] = t('color', color('#ffffff'))
        source['transparent'] = t('color', color('#00000000'))
        source['gray1'] = t('color', color('#fcfcfd' if mode == 'light' else '#111113'))
        source['gray2'] = t('color', color('#f9f9fb' if mode == 'light' else '#18191b'))
        gray_alpha = ({2:'#00005506',3:'#0000330f',4:'#00002d17',5:'#0009321f',6:'#00002f26',7:'#00062e32',8:'#00083046',11:'#0007149f'} if mode == 'light'
                      else {2:'#d8f4f609',3:'#ddeaf814',4:'#d3edf81d',5:'#d9edfe25',6:'#d6ebfd30',7:'#d9edff40',8:'#d9edff5d',11:'#f1f7feb5'})
        for n, value in gray_alpha.items():
            source[f'gray-a{n}'] = t('color', color(value))
        source['popup-enter'] = t('duration', {'value':160, 'unit':'ms'})
        source['popup-exit'] = t('duration', {'value':100, 'unit':'ms'})
        source['switch-duration'] = t('duration', {'value':140, 'unit':'ms'})
        source['switch-ease'] = t('cubicBezier', [.45, .05, .55, .95])
        source['full-opacity'] = t('number', 1)
        source['body-line'] = t('number', 1.5)
        source['ui-line'] = t('number', 20/14)
        source['tab-selected-tracking'] = t('number', -.01)
        source['title-line'] = t('number', 1.3)
        source['kbd-bottom-shade'] = t('color', color(gray_alpha[2 if mode == 'light' else 3]))
        source['kbd-highlight'] = t('color', {**color('#ffffff'), 'alpha':.95} if mode == 'light' else color(gray_alpha[11]))
        source['kbd-bottom-edge'] = t('color', color(gray_alpha[6]) if mode == 'light' else alpha(.9))
        source['kbd-ring'] = t('color', color(gray_alpha[5 if mode == 'light' else 7]))
        source['kbd-drop'] = t('color', color(gray_alpha[7]) if mode == 'light' else alpha(.95))
        source['kbd-bottom-scale'] = t('number', -.05 if mode == 'light' else -.1)
        source['kbd-ring-scale'] = t('number', .05 if mode == 'light' else .075)
        source['switch-thumb-shadow'] = t('shadow', [shadow(alpha(.1), blur=1, spread=1), shadow(alpha(.05), y=1, blur=1), shadow(alpha(.05), y=2, blur=4, spread=-1)])
        source['switch-checked-thumb-shadow'] = t('shadow', [shadow(alpha(.1), y=1, blur=3), shadow(alpha(.05), y=2, blur=4, spread=-1), shadow(alpha(.05), spread=1), shadow(color('#0044ff1e' if mode == 'light' else '#3566ff57'), spread=1), shadow(alpha(.1), x=-1, blur=1)])
        source['switch-disabled-thumb-shadow'] = t('shadow', [shadow(color(gray_alpha[2]), spread=1), shadow(alpha(.05), y=1, blur=3)])
        source['progress-rim'] = t('shadow', [shadow(color(gray_alpha[4]), spread=1, inset=True)])
        source['segment-rim'] = t('shadow', [shadow(color(gray_alpha[4]), spread=1)])
        source['segment-selected'] = t('color', color('#ffffff' if mode == 'light' else gray_alpha[3]))
        base['pins']['component.popup.enter-duration'] = {'value':160, 'unit':'ms'}
        base['pins']['component.popup.exit-duration'] = {'value':100, 'unit':'ms'}
        # Stop the old solid-menu pressed ink bleeding into neutral segmented anatomy.
        base['pins']['component.segmented.pressed-background'] = '{color.surface-subtle}'
        base['pins']['component.segmented.pressed-color'] = '{color.text}'

    regular = 'theme.radix.regular-weight'
    medium = 'theme.radix.medium-weight'
    paint = {'background':'color.surface-raised', 'color':'color.text', 'borderColor':role('transparent'), 'borderWidth':role('d0')}
    popup_motion = {'enterDuration':role('popup-enter'), 'exitDuration':role('popup-exit'), 'enterEase':'ease.enter', 'exitEase':'ease.exit'}

    # Source cards inherit the product's16/24 body text, not compact control text.
    # Card size adjusts container geometry while this default text stays16px.
    d['companion']['rules'][:] = [r for r in d['companion']['rules'] if r['target'] != 'card']
    d['companion']['rules'].append({'target':'card', 'tokens': {
        **{f'--en-font-ui-size{suffix}':role('d16') for suffix in ('','-small','-medium','-large')},
        '--en-font-ui-line-height':role('body-line'), '--en-font-ui-weight':regular,
    }})
    rule('radix-material-card', 'translucent', {'blur':role('d64'), 'background':'component.card.background', 'opaqueBackground':'color.surface'})
    rule('radix-inline-code', 'soft', {'background':'theme.radix.soft-background', 'color':'color.action-text'})
    rule('radix-keycap', 'classic', {
        'background':role('gray1'), 'color':'color.text', 'bottomShade':role('kbd-bottom-shade'), 'highlight':role('kbd-highlight'),
        'topShade':role('gray-a2'), 'bottomEdge':role('kbd-bottom-edge'), 'ring':role('kbd-ring'), 'drop':role('kbd-drop'),
        'bottomEdgeScale':role('kbd-bottom-scale'), 'ringScale':role('kbd-ring-scale'),
    })

    # Reuse native state owner and size algebra, including size=inherit and RTL.
    d['companion']['rules'][:] = [r for r in d['companion']['rules'] if r['target'] != 'switch']
    switch_roles = {
        'borderWidth':role('d1'), 'borderColor':role('gray-a5'), 'checkedBorderColor':'color.action',
        'background':role('gray-a3'), 'checkedBackground':'color.action', 'thumbBackground':role('white'), 'checkedThumbBackground':role('white'),
        'thumbShadow':role('switch-thumb-shadow'), 'checkedThumbShadow':role('switch-checked-thumb-shadow'),
        'pressedBackground':role('gray-a4'), 'pressedCheckedBackground':'color.action-pressed',
        'disabledBackground':role('gray-a3'), 'disabledBorderColor':role('gray-a3'),
        'disabledThumbBackground':role('gray2'), 'disabledThumbShadow':role('switch-disabled-thumb-shadow'),
        'duration':role('switch-duration'), 'ease':role('switch-ease'),
    }
    for name, values in {'inlineSize':(28,35,42),'blockSize':(16,20,24),'thumbSize':(14,18,22),'checkedThumbSize':(14,18,22),'inset':(1,1,1),'checkedInset':(1,1,1)}.items():
        for size, n in zip(('Small','Medium','Large'), values):
            switch_roles[f'{name}{size}'] = role(f'd{n}')
    rule('stateful-switch', 'stateful', switch_roles)

    rule('filled-radio', 'filled', {
        'borderWidth':role('d1'), 'dotSize':role('radio-dot'), 'gap':role('d8'), 'labelLineHeight':role('ui-line'),
        'background':'component.input.background', 'border':'color.boundary', 'selectedBackground':'color.action', 'selectedDotColor':'color.on-action',
        'disabledBackground':role('gray-a3'), 'disabledBorder':role('gray-a6'), 'disabledDotColor':role('gray-a8'),
    })
    rule('raised-segments', 'raised', {
        'frameInset':role('d0'), 'radius':'radius.control', 'gap':role('d0'), 'background':'color.surface-subtle', 'color':'color.text',
        'hoverBackground':role('gray-a2'), 'pressedBackground':role('gray-a3'), 'selectedBackground':role('segment-selected'),
        'selectedColor':'color.text', 'selectedShadow':role('segment-rim'), 'weight':regular, 'selectedWeight':medium,
    }, {'--en-font-ui-weight':regular})

    rule('dialog', 'sectioned', {
        **paint, 'shadow':'shadow.dialog', 'inlineSize':role('d600'), 'fontSize':role('d16'), 'lineHeight':role('body-line'), 'fontWeight':regular,
        'sectionInlinePadding':role('d24'), 'headerBlockStartPadding':role('d24'), 'headerBlockEndPadding':role('d12'), 'headerGap':role('d12'),
        'bodyBlockStartPadding':role('d0'), 'bodyBlockEndPadding':role('d0'), 'footerBlockStartPadding':role('d0'), 'footerBlockEndPadding':role('d24'), 'footerGap':role('d12'),
        'titleFontSize':role('d20'), 'titleLineHeight':role('title-line'), 'titleFontWeight':'font.heading-small.weight', 'descriptionColor':'color.text',
        'enterDuration':'component.dialog.enter-duration', 'exitDuration':'component.dialog.exit-duration', 'enterEase':'ease.enter', 'exitEase':'ease.exit',
        'surfaceScale':'motion.surface-scale', 'surfaceOffset':'motion.surface-offset',
        'radius':role('d12'),
    })

    # Keep Popover automatic width. Shared inlineSize would force a 480px popup.
    rule('popover', 'sectioned', {
        **paint, **popup_motion, 'shadow':'shadow.overlay', 'padding':role('d16'), 'fontSize':role('d16'), 'lineHeight':role('body-line'), 'fontWeight':regular,
        'maxInlineSize':role('d480'), 'radius':role('d8'),
    })
    rule('hover-card', 'sectioned', {
        **paint, **popup_motion, 'shadow':'shadow.overlay', 'padding':role('d16'), 'fontSize':role('d16'), 'lineHeight':role('body-line'), 'fontWeight':regular,
        'maxInlineSize':role('d480'), 'radius':role('d8'),
    })
    rule('menu', 'compact-surface', {
        **paint, **popup_motion, 'shadow':'shadow.overlay', 'padding':role('d8'), 'radius':role('d8'), 'fontSize':role('d14'), 'lineHeight':role('ui-line'), 'fontWeight':regular,
    })
    rule('menu-item', 'compact', {
        'fontSize':role('d14'), 'lineHeight':role('ui-line'), 'weight':regular, 'radius':role('d4'),
        'inlinePadding':role('d12'), 'blockPadding':role('d6'), 'choicePadding':role('d24'), 'choiceInset':role('d4'),
    })
    rule('progress-bar', 'progress-rounded', {'radius':'radius.pill','shadow':role('progress-rim'),'trackColor':role('gray-a3')})

    # Themes 3.3.0 default size 2: gapless lists, 40px visual minimum and -.01em
    # active tracking. Native semantics and protected fine/coarse targets remain.
    # The source inset hover plate and moving segmented indicator stay adaptations.
    rule('tabs', 'line', {'gap':role('d0')})
    rule('tab-list', 'line', {'gap':role('d0')})
    rule('tab', 'line', {
        'minBlockSize':role('d40'), 'selectedTracking':role('tab-selected-tracking'),
        'fontSize':role('d14'), 'lineHeight':role('ui-line'), 'inlinePadding':role('d16'), 'blockPadding':role('d8'),
        'indicatorWidth':role('d2'), 'restColor':'color.text-muted', 'selectedColor':'color.text', 'indicatorColor':'color.action',
    }, {'--en-font-ui-weight':regular})

    d['reference']['deepAnatomyReport'] = 'plans/theme-deep-review/radix.md'
    return d


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parents[2])
    args = parser.parse_args()
    root = args.root.resolve()
    path = root / 'tooling/theme-candidates/definitions.json'
    definitions = json.loads(path.read_text())
    index = next(index for index, item in enumerate(definitions) if item['id'] == 'radix-inspired')
    definition = definitions[index]
    if not (root / 'packages/tokens/src/companion/display.ts').exists():
        raise SystemExit('Integrate and register the reviewed shared companion engine before applying.')
    if 'regular-weight' not in definition['baseOptions']['light'].get('source', {}).get('theme', {}).get('radix', {}):
        raise SystemExit('Apply radix-update.py --presentations first.')
    definitions[index] = apply_anatomy(definition)
    path.write_text(json.dumps(definitions, indent=2) + '\n')
    print('Prepared Radix major-family anatomy applied; no generated output or other theme was changed.')


if __name__ == '__main__':
    main()
