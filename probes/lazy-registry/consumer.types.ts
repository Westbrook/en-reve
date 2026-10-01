import {createElementLoader,createDefinitionLoader,DefinitionLoadError,type DefinitionLoader,type DefinitionLoaders} from '@en-reve/elements/lazy.js';
import {createElementScope} from '@en-reve/elements/element-scope.js';
const scope=createElementScope({document});
const loader:DefinitionLoader=createElementLoader(scope.registry);
const manifest:DefinitionLoaders={'en-command-palette':()=>import('@en-reve/elements/definitions/command-palette.js').then(module=>module.commandPaletteDefinition)};
void createDefinitionLoader(scope.registry,manifest).ensure(['en-command-palette'],{retry:true});
void loader.load(['en-button']);
const error=new DefinitionLoadError('load',['en-button'],new Error('offline'));
void error.stage;
// @ts-expect-error A target registry is mandatory.
createElementLoader();
