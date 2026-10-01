import type {ElementDefinition} from '@en-reve/primitives/interactions/registration.js';
import {EnFileUpload} from '../file-upload.js';
import {buttonDefinition} from './button.js';
import {iconDefinition} from './icon.js';

/** Registration metadata only; importing this module does not define elements. */
export const fileUploadDefinition = {
  tagName: 'en-file-upload',
  elementClass: EnFileUpload,
  dependencies: [buttonDefinition, iconDefinition],
} as const satisfies ElementDefinition;
