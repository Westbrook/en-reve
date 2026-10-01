import type { ThemeOptions } from '@en-reve/tokens';

/** Code-authored values are validated by the compiler, not restricted to editor menus. */
export const authoringBaseline: ThemeOptions = {
  name: 'editorial',
  pins: {
    'font.ui.family': ['Georgia', 'serif'],
    'font.ui.weight': 450,
    'shadow.overlay': [
      { color: { colorSpace: 'srgb', components: [0, 0, 0], alpha: 0.12 },
        offsetX: { value: 0, unit: 'px' }, offsetY: { value: 2, unit: 'px' },
        blur: { value: 4, unit: 'px' }, spread: { value: 0, unit: 'px' } },
      { color: { colorSpace: 'srgb', components: [0, 0, 0], alpha: 0.18 },
        offsetX: { value: 0, unit: 'px' }, offsetY: { value: 12, unit: 'px' },
        blur: { value: 28, unit: 'px' }, spread: { value: 0, unit: 'px' } },
    ],
  },
};
