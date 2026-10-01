import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';

const themeOutputs={
 'packages/styles/tests/theme-cascade/playwright.config.ts':'cascade',
 'packages/styles/tests/state-paint/playwright.config.ts':'states',
 'probes/api-contracts/playwright.config.ts':'api-parts',
 'packages/styles/tests/composition/playwright.config.ts':'composition',
 'apps/docs/tests/theme-regression.config.ts':'docs',
 'apps/docs/tests/theme-refresh.config.ts':'candidates',
};
const releaseOutputs={
 'packages/elements/src/internal/tests/playwright.config.ts':'geometry',
 'packages/elements/src/commands/tests/playwright.config.ts':'commands',
};
/** Caller-chosen legacy roots retain their named child receipts; default roots are fresh. */
export function publicViewOutput(root,view,environment=process.env) {
 const legacyVariable=view==='root#test:theme'?'EN_THEME_TEST_OUTPUT_DIR':view==='root#test:release'?'EN_RELEASE_TEST_OUTPUT_DIR':null;
 const explicit=environment.EN_EXECUTION_OUTPUT??(legacyVariable?environment[legacyVariable]:null);
 const output=resolve(explicit??resolve(root,'artifacts/test-execution',randomUUID()));
 const named=view==='root#test:theme'?themeOutputs:view==='root#test:release'?releaseOutputs:{};
 const mapping=Object.fromEntries(Object.entries(named).map(([config,name])=>[pathToFileURL(resolve(root,config)).href,resolve(output,name)]));
 return {output,explicit:Boolean(explicit),legacyVariable,environment:{
  EN_TEST_PIPELINE_OUTPUT:resolve(output,'browser'),
  EN_TEST_PIPELINE_CONFIG_OUTPUTS:JSON.stringify(mapping),
  PROPERTY_TEST_OUTPUT_DIR:resolve(output,'properties'),SCOPE_TEST_OUTPUT_DIR:resolve(output,'scopes'),
  ...(legacyVariable?{[legacyVariable]:output}:{}),
 }};
}
