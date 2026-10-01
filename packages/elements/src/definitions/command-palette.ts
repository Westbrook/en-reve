import type {ElementDefinition} from '@en-reve/primitives/interactions/registration.js';
import {EnCommandPalette} from '../command-palette.js';
import {buttonDefinition} from './button.js';
import {iconDefinition} from './icon.js';

/** Registration metadata only; importing this module does not define elements. */
export const commandPaletteDefinition = {
  tagName: 'en-command-palette',
  elementClass: EnCommandPalette,
  dependencies: [buttonDefinition, iconDefinition],
} as const satisfies ElementDefinition;
