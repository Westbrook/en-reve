import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolveTheme,emitThemeCSS,managedEditors,stableStringify,tokenDocument,densityNames,createThemePair,emitThemePairCSS,customizationContracts,createPropertyRegistrationPlan,emitPropertyRegistrations} from '../dist/index.js';
const directory = fileURLToPath(new URL('../dist/',import.meta.url));
await mkdir(`${directory}/themes`,{recursive:true});
const theme = resolveTheme();
const defaults = Object.fromEntries(Object.values(theme.tokens).filter(t => !t.id.startsWith('component.')).map(t => [t.cssName,t.cssValue]));
await writeFile(`${directory}/defaults.js`,`/** Generated static data. No resolver or DOM dependency. */\nexport const defaultCSSValues = Object.freeze(${JSON.stringify(defaults,null,2)});\nexport function defaultCSSValue(name) { if (!Object.hasOwn(defaultCSSValues,name)) throw new RangeError('Unknown token ' + name); return defaultCSSValues[name]; }\n`);
await writeFile(`${directory}/defaults.d.ts`,'export declare const defaultCSSValues: Readonly<Record<string,string>>;\nexport declare function defaultCSSValue(name:string):string;\n');
const defaultPair = createThemePair({name:'default',light:theme,dark:resolveTheme({mode:'dark'})});
const registrations = emitPropertyRegistrations(theme);
await writeFile(`${directory}/properties.css`,registrations);
await writeFile(`${directory}/default.css`,registrations+emitThemePairCSS(defaultPair,{scope:'root'}));
await writeFile(`${directory}/customization.json`,JSON.stringify({schemaVersion:1,contracts:customizationContracts(theme),registration:createPropertyRegistrationPlan(theme)},null,2)+'\n');
const portable = result => tokenDocument(Object.fromEntries(Object.values(result.tokens).map(t => [t.id,{$type:t.type,$value:t.value,$description:t.description}])));
await writeFile(`${directory}/tokens.json`,JSON.stringify(portable(theme),null,2)+'\n');
await writeFile(`${directory}/source.tokens.json`,JSON.stringify(theme.source,null,2)+'\n');
await writeFile(`${directory}/manifest.json`,JSON.stringify({schemaVersion:1,dtcgSubset:'2025.10 nested groups, whole-token aliases; sRGB color subset',version:theme.compilerVersion,tokens:theme.tokens,editors:managedEditors(theme),customization:customizationContracts(theme)},null,2)+'\n');
for (const mode of ['light','dark']) for (const density of densityNames) {
  const result = resolveTheme({mode,density});
  await writeFile(`${directory}/themes/${result.name}.css`,emitThemeCSS(result,{colorScheme:true}));
  await writeFile(`${directory}/themes/${result.name}.tokens.json`,stableStringify(portable(result)));
}
