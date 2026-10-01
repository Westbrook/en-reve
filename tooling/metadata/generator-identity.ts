import {readFile} from 'node:fs/promises';
import {digestBytes} from '../evidence/identity.ts';

/** Fingerprint the current extraction implementation, distributions, compiler and policy. */
export async function generatorIdentity() {
  const {compilerIdentity, assertGeneratorCompilerOwners} = await import('./compiler-api.mjs');
  const {candidatePolicy} = await import('./candidate-policy.mjs');
  const paths = ['generate.ts','compiler-api.mjs','compiler-api.d.mts','candidate-policy.mjs','candidate-modules.ts','candidate-package-exports.ts','candidate-inheritance.ts','candidate-heritage.ts','candidate-lit-ownership.ts','candidate-contract-exclusions.ts','omitted-css-parts.ts','generate-wc-toolkit.ts',
    'generate-elements.ts','finalize-customization.ts','constructor-composition-contract.ts','event-contracts.ts','public-event-contracts.ts','lit-contract.ts','type-text.ts','references.ts','definition-graph.ts',
    'candidate-constructor-cohort.ts','candidate-ordinary-projection.ts','candidate-mixin-origins.ts','candidate-mixin-graph.ts',
    'candidate-origin-extraction.ts','candidate-constructor-composition.ts','candidate-constructor-serialization.ts','candidate-constructor-policies.ts',
    'captured-compiler-program.ts','captured-constructor-imports.ts','captured-annotation-scope.ts','captured-factory-event-dispatch.ts','captured-factory-event-admission.ts','captured-dispatch-helper-policy.ts','captured-event-type-projection.ts','captured-event-visibility.ts','portable-constructor-proofs.ts','generator-identity.ts','../customization/cem.mjs','../evidence/identity.ts'];
  return {version: 10, packages: assertGeneratorCompilerOwners(), compiler: compilerIdentity(), policy: candidatePolicy,
    sources: Object.fromEntries(await Promise.all(paths.map(async path => [path, digestBytes(await readFile(new URL(path, import.meta.url)))])))};
}

/** Fresh comparison tools use the same extraction policy as maintained producers. */
export const candidateGeneratorIdentity = generatorIdentity;
