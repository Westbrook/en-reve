import {buttonDefinition} from './button.js';
import {iconDefinition} from './icon.js';
import {carouselDefinition} from './carousel.js';
import type {ElementDefinition} from '@en-reve/primitives/interactions/registration.js';
import {EnMediaViewer} from '../media-viewer.js';
export const mediaViewerDefinition = { tagName: 'en-media-viewer', elementClass: EnMediaViewer, dependencies: [buttonDefinition, iconDefinition, carouselDefinition] } as const satisfies ElementDefinition;
