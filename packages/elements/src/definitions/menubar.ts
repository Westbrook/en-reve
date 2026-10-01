import {menuDefinition} from './menu.js';
import {menuItemDefinition} from './menu-item.js';
import type {ElementDefinition} from '@en-reve/primitives/interactions/registration.js';
import {EnMenubar} from '../menubar.js';
export const menubarDefinition = { tagName: 'en-menubar', elementClass: EnMenubar, dependencies: [menuDefinition, menuItemDefinition] } as const satisfies ElementDefinition;
