#!/usr/bin/env python3
"""Prepared Radix-only correction. Run only after coordinator review.

Default: existing typed hooks. --presentations: also requires the shared finite
companion presentation engine integrated into this checkout. No generated edits.
"""
import argparse
import json
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parents[2])
parser.add_argument('--presentations', action='store_true')
args = parser.parse_args()
root = args.root.resolve()
definitions_path = root / 'tooling/theme-candidates/definitions.json'
definitions = json.loads(definitions_path.read_text())
definition = next(item for item in definitions if item['id'] == 'radix-inspired')
if args.presentations and not (root / 'packages/tokens/src/companion/display.ts').exists():
    raise SystemExit('--presentations requires the integrated shared companion engine')

def color(value):
    value = value.removeprefix('#')
    result = {'colorSpace': 'srgb', 'components': [int(value[i:i+2], 16) / 255 for i in (0, 2, 4)]}
    if len(value) == 8:
        result['alpha'] = int(value[6:8], 16) / 255
    return result

def dim(value, unit='px'):
    return {'value': value, 'unit': unit}

def token(type_name, value):
    return {'$type': type_name, '$value': value}

def append_rule(rule):
    rules = definition['companion']['rules']
    # These targets currently have no Radix-specific rule other than buttons.
    # On rerun replace only the exact target/variant to avoid duplicates.
    rules[:] = [old for old in rules if not (old['target'] == rule['target'] and old.get('variant') == rule.get('variant'))]
    rules.append(rule)

for mode in ('light', 'dark'):
    base = definition['baseOptions'][mode]
    pins = base['pins']
    pins['font.ui.weight'] = 400
    pins['component.tab.pressed-color'] = '{color.text}'
    # Canonical chips retain solid Indigo3/4/5 fills, so held ink follows soft controls, not solid option rows.
    pins['component.editor-token.pressed-color'] = '{theme.button.secondary.pressed-color}'
    pins['component.card.shadow'] = '{shadow.none}'
    # CSS absolute-position origin is inside the existing 1px track border:
    # source outer-edge inset1px therefore needs authored offset0px here.
    for name, values in {
        'size.switch-inline': (28, 35, 42),
        'size.switch-block': (16, 20, 24),
        'size.switch-thumb': (14, 18, 22),
        'space.switch-inset': (0, 0, 0),
        'size.progress': (4, 6, 8),
        'size.range-track': (6, 8, 10),
        'size.avatar': (32, 40, 48),
        'space.badge-inline': (6, 6, 8),
        'space.badge-block': (2, 2, 4),
    }.items():
        pins[name] = dim(values[1])
        for size, value in zip(('small', 'medium', 'large'), values):
            pins[f'{name}-{size}'] = dim(value)
    a3, a4, a5 = ('#0047f112', '#0044ff1e', '#0044ff2d') if mode == 'light' else ('#2f62ff3c', '#3566ff57', '#4171fd6b')
    source = base.setdefault('source', {}).setdefault('theme', {})
    for state, value in [('rest', a3), ('hover', a4), ('pressed', a5)]:
        source['button']['secondary'][f'{state}-background'] = token('color', color(value))
    # Source Indigo11 on A5/white is 4.469:1 after browser alpha serialization.
    # One sRGB step darker retains the source hue/fill with readable held ink.
    source['button']['secondary']['pressed-color'] = ({
        **token('color', color('#395ac6')),
        '$description': 'One sRGB step darker than source Indigo11 for readable pressed soft controls over white; preserve source A5 fill.',
    } if mode == 'light' else token('color', '{color.action-text}'))
    source['button']['ghost']['hover-background'] = token('color', color(a3))
    source['button']['ghost']['pressed-background'] = token('color', color(a4))
    r = source.setdefault('radix', {})
    r.update({
        'regular-weight': token('fontWeight', 400),
        'medium-weight': token('fontWeight', 500),
        'badge-radius': token('dimension', dim(3)),
    })
    # The managed edit currently overrides the baseline weight; edit its source.
    recipe_path = root / 'tooling/theme-candidates' / definition['inputs'][mode]
    recipe = json.loads(recipe_path.read_text())
    for edit in recipe:
        if edit.get('id') == 'font.ui.weight':
            edit['value'] = 400
    recipe_path.write_text(json.dumps(recipe, indent='\t') + '\n')
    if args.presentations:
        r.update({
            'tooltip-background': token('color', color('#1c2024' if mode == 'light' else '#edeef0')),
            'tooltip-color': token('color', color('#fcfcfd' if mode == 'light' else '#111113')),
            'tooltip-radius': token('dimension', dim(4)),
            'tooltip-inline-padding': token('dimension', dim(8)),
            'tooltip-block-padding': token('dimension', dim(4)),
            'tooltip-duration': token('duration', {'value': 140, 'unit': 'ms'}),
            'zero': token('dimension', dim(0)),
            'transparent': token('color', color('#00000000')),
            'avatar-radius': token('dimension', dim(6)),
            'avatar-font-scale': token('number', 16/14),
            'soft-background': token('color', color(a3)),
            'badge-height': token('dimension', dim(20)),
            'badge-padding': token('dimension', dim(6)),
            'switch-background': token('color', color('#0000330f' if mode == 'light' else '#ddeaf814')),
            'white': token('color', color('#ffffff')),
        })

append_rule({'target': 'choice', 'tokens': {'--en-font-label-strong-weight': 'theme.radix.regular-weight', '--en-font-ui-weight': 'theme.radix.regular-weight'}})
# Radius is a finite presentation role, not a typed baseline component hook.
append_rule({'target': 'badge', 'tokens': {'--en-font-ui-weight': 'theme.radix.medium-weight'}})

if args.presentations:
    append_rule({'target': 'tooltip', 'presentation': 'compact', 'tokens': {}, 'roles': {
        'background': 'theme.radix.tooltip-background', 'color': 'theme.radix.tooltip-color',
        'borderColor': 'theme.radix.transparent', 'borderWidth': 'theme.radix.zero', 'shadow': 'shadow.none',
        'radius': 'theme.radix.tooltip-radius', 'paddingInline': 'theme.radix.tooltip-inline-padding',
        'paddingBlock': 'theme.radix.tooltip-block-padding', 'fontSize': 'font.ui.size',
        'lineHeight': 'font.ui.line-height', 'fontWeight': 'theme.radix.regular-weight',
        'enterDuration': 'theme.radix.tooltip-duration', 'exitDuration': 'theme.radix.tooltip-duration',
        'enterEase': 'ease.enter', 'exitEase': 'ease.exit',
    }})
    append_rule({'target': 'avatar', 'presentation': 'avatar-subtle', 'tokens': {}, 'roles': {
        'radius': 'theme.radix.avatar-radius',
        'background': 'theme.radix.soft-background', 'color': 'color.action-text', 'font-weight': 'theme.radix.medium-weight', 'font-scale': 'theme.radix.avatar-font-scale',
    }})
    append_rule({'target': 'badge', 'presentation': 'badge-subtle', 'tokens': {'--en-font-ui-weight': 'theme.radix.medium-weight'}, 'roles': {
        'radius': 'theme.radix.badge-radius',
        'minimum-size': 'theme.radix.badge-height', 'inline-padding': 'theme.radix.badge-padding', 'gap': 'theme.radix.badge-padding',
    }})
    append_rule({'target': 'switch', 'presentation': 'solid', 'tokens': {}, 'roles': {
        'background': 'theme.radix.switch-background', 'border': 'theme.radix.transparent',
        'selected-background': 'color.action', 'thumb-background': 'theme.radix.white', 'selected-color': 'theme.radix.white',
    }})

definition['reference']['deepReviewedAt'] = '2026-10-03'
definition['reference']['deepReviewReport'] = 'plans/theme-deep-review/radix.md'
definition['rationale'] = ('Radix Themes default product interpretation: indigo/auto-slate, medium radius, 100% scale, compact controls and regular body/choice typography. '
    'Independent alpha soft/ghost state steps, flat default surface cards, precise switch/progress/range geometry and layered popup/dialog elevation. '
    'Protected targets, stronger functional boundaries/focus, sRGB, source variant vocabulary, font metrics, blur and state choreography remain documented adaptations. '
    'See the deep review for current fixes, remaining anatomy gaps and bounded verification.')
definitions_path.write_text(json.dumps(definitions, indent=2) + '\n')
print('Updated Radix definitions and two authored recipes only; generated assets require coordinator validation/regeneration.')
