import type {ElementRegistry} from '@en-reve/primitives/interactions/registration.js';
import {createDefinitionLoader, type DefinitionLoader} from './lazy-loader.js';
import {elementLoaders} from './lazy-manifest.js';
export {createDefinitionLoader, createDefinitionPreparation, DefinitionLoadError} from './lazy-loader.js';
export type {DefinitionPreparation, DefinitionLoader, DefinitionLoaders, DefinitionLoadOptions, DefinitionLoadStage} from './lazy-loader.js';
export {elementLoaders} from './lazy-manifest.js';
export type {LazyElementTag} from './lazy-manifest.js';

/** Lazy access to the library catalog without importing components or registering global names at startup. */
export function createElementLoader(registry: ElementRegistry): DefinitionLoader {
  return createDefinitionLoader(registry, elementLoaders);
}
