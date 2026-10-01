import {buttonDefinition} from './button.js';
import {iconDefinition} from './icon.js';
import type {ElementDefinition} from '@en-reve/primitives/interactions/registration.js';
import {EnSheet} from '../sheet.js';
export const sheetDefinition = { tagName: 'en-sheet', elementClass: EnSheet, dependencies: [buttonDefinition, iconDefinition] } as const satisfies ElementDefinition;
