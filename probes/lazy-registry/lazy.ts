import {start} from './runtime.js';
import {createDefinitionLoader} from '@en-reve/elements/lazy-loader.js';
const loaders = {'en-command-palette': () => import('@en-reve/elements/definitions/command-palette.js').then(module => module.commandPaletteDefinition)};
void start(registry => createDefinitionLoader(registry, loaders), []);
