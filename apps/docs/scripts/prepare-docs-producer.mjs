import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readAuthoredSpecimens } from './authored-specimen-sources.mjs';
import { transform } from 'lightningcss';
import { prepareGuides } from './prepare-guides.mjs';
import { generateAPIReference } from './generate-api-reference.mjs';
import { generateAPIExamples } from './generate-api-examples.mjs';
import { prepareSettingsScenarios, settingsScenarioPages } from './settings-scenario-pages.mjs';
import { validateCandidateDefinitions } from '../../../tooling/theme-candidates/catalogue.mjs';

const require = createRequire(import.meta.url);
const docsRoot = fileURLToPath(new URL('..', import.meta.url));
// Review documents live in separate published sections rather than plans/.
const reviewMarkdown = text => text
  .replace(/\]\((?:\.\.\/)?(api-next-release\.md|api-normalization-followup\.md)\)/g, '](/reviews/api-normalization/$1?progress-report)')
  .replace(/\]\((theme-02-cascade-migration\.md|theme-06-composition\.md|theme-native-validation\.md)\)/g, '](/reviews/theme-customization/$1?progress-report)');
const refreshMarkdown = text => reviewMarkdown(text)
  .replace(/\]\(\.\.\/apps\/docs\/public\/fonts\/theme-references\//g, '](/fonts/theme-references/')
  // Source citations remain workspace references; source code is not published.
  .replace(/\[([^\]]+)\]\(\.\.\/((?:packages|apps|tooling|artifacts)\/[^)]+)\)/g, '$1 (`$2`)');

/** Actual document URLs, separate from JavaScript's module resolution. */
export const stylesheetAssets = [
  { specifier: '@en-reve/tokens/default.css', href: '/styles/tokens.css' },
  { specifier: '@en-reve/styles/navigation.css', href: '/styles/navigation.css' },
  { specifier: '@en-reve/styles/links.css', href: '/styles/links.css' },
  { specifier: '@en-reve/styles/typography.css', href: '/styles/typography.css' },
  { specifier: '@en-reve/styles/content.css', href: '/styles/content.css' },
  { specifier: '@en-reve/styles/table.css', href: '/styles/table.css' },
  { specifier: '@en-reve/styles/radio.css', href: '/styles/radio.css' },
  { specifier: 'microlighter/themes/github.css', href: '/styles/github.css' },
  { specifier: 'microlighter/themes/night-owl.css', href: '/styles/night-owl.css' },
];
const sourceInputs = [
  'src/examples.ts',
  'src/token-copy.ts',
  'src/workflows/sso/template.ts',
  'src/workflows/settings/template.ts',
  'src/workflows/chat/template.ts',
  'src/workflows/selection/template.ts',
  'src/workflows/assets/template.ts',
].map(path => resolve(docsRoot, path));
const cssInputs = stylesheetAssets.map(asset => ({ ...asset, path: require.resolve(asset.specifier) }));
const watchedFiles = [...sourceInputs, ...['change-consumption.ts', 'color-spaces-demo.ts', 'editor-color-extension.ts'].map(name => resolve(docsRoot, 'src', name)), resolve(docsRoot, 'src/virtual-collection-demo.ts'), resolve(docsRoot, 'src/file-upload-demo.ts'), resolve(docsRoot, 'src/tree-data-demo.ts'), resolve(docsRoot, 'src/calendar-demo.ts'), resolve(docsRoot, 'src/multi-step-demo.ts'), resolve(docsRoot, 'src/workflows/settings/scenarios.ts'), resolve(docsRoot, 'workflows/settings.html'), ...cssInputs.map(asset => asset.path)];

async function writeChanged(path, content) {
  const bytes = Buffer.isBuffer(content) ? content : Buffer.from(content);
  try {
    if (bytes.equals(await readFile(path))) return false;
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, bytes);
  return true;
}

/** Generate ordinary ESM files and copy explicit CSS assets before compilation. */
export async function prepareDocs() {
  await prepareSettingsScenarios(docsRoot);
  const generatedRoot = resolve(docsRoot, 'src/generated');
  const publicRoot = resolve(docsRoot, 'public');
  const [{ sources: sourceCatalog }, workflows] = await Promise.all([
    readAuthoredSpecimens(docsRoot),
    Promise.all(sourceInputs.slice(2).map(path => readFile(path, 'utf8'))),
  ]);
  const apiReference = await generateAPIReference({ workspaceRoot: resolve(docsRoot, '../..') });
  const modules = [
    {
      name: 'specimens',
      value: sourceCatalog,
      declaration: 'declare const sources: Record<string, string>;\nexport default sources;\n',
    },
    ...['sso', 'settings', 'chat', 'selection', 'assets'].map((name, index) => ({
      name: `workflow-${name}`,
      value: workflows[index],
      declaration: 'declare const source: string;\nexport default source;\n',
    })),
  ];
  const presetRoot = resolve(docsRoot, '../../tooling/theme-candidates');
  const definitions = validateCandidateDefinitions(JSON.parse(await readFile(resolve(presetRoot, 'definitions.json'), 'utf8')));
  modules.push({ name: 'showcase-items', value: [{ value: 'default', label: 'en-reve' }, ...definitions.map(definition => ({
    value: definition.id, label: definition.label ?? definition.title.split(' · ')[0],
  }))], declaration: 'declare const items: {value:string;label:string}[];\nexport default items;\n' });
  modules.push({ name: 'showcase-catalogue', value: definitions.map(definition => ({
    id: definition.id, label: definition.label ?? definition.title.split(' · ')[0],
    ...(definition.baseOptions ? { baseOptions: definition.baseOptions } : {}),
    ...(definition.companion ? { companion: definition.companion } : {}),
  })), declaration: "import type { ThemeOptions, ThemeCompanionRecipe } from '@en-reve/tokens';\ndeclare const catalogue: {id:string;label:string;baseOptions?:{light:ThemeOptions;dark:ThemeOptions};companion?:ThemeCompanionRecipe}[];\nexport default catalogue;\n" });
  const presets = await Promise.all(definitions.map(async definition => ({
    id: definition.id, title: definition.title, rationale: definition.rationale,
    light: JSON.parse(await readFile(resolve(presetRoot, definition.inputs.light), 'utf8')),
    dark: JSON.parse(await readFile(resolve(presetRoot, definition.inputs.dark), 'utf8')),
  })));
  modules.push({ name: 'showcase-presets', value: presets,
    declaration: 'declare const presets: {id:string;title:string;rationale:string;light:{type:string;mode?:string;density?:string;id?:string;value?:unknown}[];dark:{type:string;mode?:string;density?:string;id?:string;value?:unknown}[]}[];\nexport default presets;\n' });
  const writes = await Promise.all([
    ...['spectrum-wc-gen2-migration.md', 'web-awesome-theme.md', 'web-awesome-theme-fidelity.md', 'component-gap-closure.md', 'component-gap-implementation.md', 'button-like-press-audit.md', 'button-like-press-implementation.md', 'theme-inspired-adoption.md', 'theme-press-correction.md', 'theme-api-authoring-contract.md', 'theme-api-implementation.md', 'theme-refresh-radix.md', 'theme-refresh-radix-base.json', 'theme-refresh-library-comparison.md', 'theme-refresh-library-gaps-radix.md', 'theme-refresh-library-gaps-spectrum-fluent.md', 'theme-refresh-library-gaps-astryx-shadcn.md', 'theme-refresh-pressed-states.md', 'theme-refresh-fluent2-web-components.md', 'theme-refresh-fluent2.md', 'theme-refresh-fluent2-api-findings.md', 'theme-refresh-fluent2-base.json', 'theme-refresh-fluent2-validation.json', 'theme-refresh-report.md', 'theme-refresh-spectrum-fluent.md', 'theme-refresh-astryx-shadcn.md', 'theme-refresh-holotable.md', 'theme-refresh-originals.md', 'theme-refresh-api-audit.md', 'theme-refresh-spectrum-fluent-base.json', 'theme-refresh-astryx-shadcn-base.json', 'theme-refresh-holotable-base.json', 'theme-refresh-spectrum-fluent-validation.json', 'theme-refresh-astryx-shadcn-verification.json'].map(async name => writeChanged(resolve(publicRoot, 'reviews/theme-customization', name), refreshMarkdown(await readFile(resolve(docsRoot, '../../plans', name), 'utf8')))),
    writeChanged(resolve(publicRoot, 'reviews/theme-customization/customization.json'), await readFile(resolve(docsRoot, '../../packages/tokens/dist/customization.json'), 'utf8')),
    writeChanged(resolve(publicRoot, 'reviews/theme-customization/theme-02-cascade-migration.md'), await readFile(resolve(docsRoot, '../../plans/theme-02-cascade-migration.md'), 'utf8')),
    writeChanged(resolve(publicRoot, 'reviews/theme-customization/theme-regression.md'), (await readFile(resolve(docsRoot, '../../tooling/theme-proof/README.md'), 'utf8')).replace('../../plans/theme-native-validation.md', './theme-native-validation.md')),
    ...['theme-next-release.md', 'theme-native-validation.md', 'theme-followup-verification.json'].map(async name => writeChanged(resolve(publicRoot, 'reviews/theme-customization', name), reviewMarkdown(await readFile(resolve(docsRoot, '../../plans', name), 'utf8')))),
    writeChanged(resolve(publicRoot, 'reviews/theme-customization/theme-followup-review-2026-09-18.md'), await readFile(resolve(docsRoot, '../../plans/theme-followup-review-2026-09-18.md'), 'utf8')),
    writeChanged(resolve(publicRoot, 'reviews/theme-customization/theme-08-proof.md'), await readFile(resolve(docsRoot, '../../plans/theme-08-proof.md'), 'utf8')),
    writeChanged(resolve(publicRoot, 'reviews/theme-customization/theme-05-authoring.md'), await readFile(resolve(docsRoot, '../../plans/theme-05-authoring.md'), 'utf8')),
    writeChanged(resolve(publicRoot, 'reviews/theme-customization/theme-03-state-paint.md'), await readFile(resolve(docsRoot, '../../plans/theme-03-state-paint.md'), 'utf8')),
    writeChanged(resolve(publicRoot, 'reviews/theme-customization/theme-06-composition.md'), await readFile(resolve(docsRoot, '../../plans/theme-06-composition.md'), 'utf8')),
    writeChanged(resolve(publicRoot, 'reviews/theme-customization/theme-04-scopes.md'), await readFile(resolve(docsRoot, '../../plans/theme-04-scopes.md'), 'utf8')),
    writeChanged(resolve(publicRoot, 'reviews/theme-customization/theme-07-authoring-pilot.md'), (await readFile(resolve(docsRoot, '../../plans/theme-07-authoring-pilot.md'), 'utf8')).replace('../tooling/theme-authoring-pilot/README.md', './theme-07-pilot-readme.md?progress-report')),
    writeChanged(resolve(publicRoot, 'reviews/theme-customization/theme-07-pilot-readme.md'), (await readFile(resolve(docsRoot, '../../tooling/theme-authoring-pilot/README.md'), 'utf8')).replace('../css-authoring/README.md', './theme-07-css-readme.md?progress-report')),
    writeChanged(resolve(publicRoot, 'reviews/theme-customization/theme-07-css-authoring.md'), (await readFile(resolve(docsRoot, '../../plans/theme-07-css-authoring.md'), 'utf8')).replace('../tooling/css-authoring/README.md', './theme-07-css-readme.md?progress-report')),
    writeChanged(resolve(publicRoot, 'reviews/theme-customization/theme-07-css-readme.md'), await readFile(resolve(docsRoot, '../../tooling/css-authoring/README.md'), 'utf8')),
    writeChanged(resolve(publicRoot, 'reviews/theme-customization/contract-guide.md'), await readFile(resolve(docsRoot, '../../packages/tokens/README.md'), 'utf8')),
    ...['coverage.json', 'coverage.md'].map(async name => writeChanged(resolve(publicRoot, 'reviews/theme-customization', name), await readFile(resolve(docsRoot, '../../tooling/customization/evidence', name), 'utf8'))),
    writeChanged(resolve(publicRoot, 'reviews/theme-customization.html'), await readFile(resolve(docsRoot, '../../plans/api-normalization-audit/theme-review.html'), 'utf8')),
    ...['theme-overview.md', 'theme-decisions.md', 'theme-hierarchy.md', 'theme-scoping.md', 'theme-coverage.md', 'theme-functions.md', 'theme-readiness.md', 'theme-coverage.json'].map(async name =>
      writeChanged(resolve(publicRoot, 'reviews/theme-customization', name), await readFile(resolve(docsRoot, '../../plans/api-normalization-audit', name)))),
    writeChanged(resolve(publicRoot, 'reviews/api-normalization.html'), await readFile(resolve(docsRoot, '../../plans/api-normalization-audit/review.html'), 'utf8')),
    ...['api-normalization-followup.md', 'api-next-release.md', 'api-normalization-followup-review-2026-09-19.md'].map(async name => writeChanged(resolve(publicRoot, 'reviews/api-normalization', name), reviewMarkdown(await readFile(resolve(docsRoot, '../../plans', name), 'utf8')))),
    writeChanged(resolve(publicRoot, 'reviews/api-normalization/api-01-events.md'), await readFile(resolve(docsRoot, '../../plans/api-01-events.md'), 'utf8')),
    writeChanged(resolve(publicRoot, 'reviews/api-normalization/api-06-verification.json'), await readFile(resolve(docsRoot, '../../plans/api-06-verification.json'), 'utf8')),
    writeChanged(resolve(publicRoot, 'reviews/api-normalization/api-06-customization.md'), await readFile(resolve(docsRoot, '../../plans/api-06-customization.md'), 'utf8')),
    writeChanged(resolve(publicRoot, 'reviews/api-normalization/api-09-context.md'), await readFile(resolve(docsRoot, '../../plans/api-09-context.md'), 'utf8')),
    writeChanged(resolve(publicRoot, 'reviews/api-normalization/component-follow-up-backlog.md'), await readFile(resolve(docsRoot, '../../plans/component-follow-up-backlog.md'), 'utf8')),
    ...['api-10-completion.md', 'api-10-verification.json'].map(async name => writeChanged(resolve(publicRoot, 'reviews/api-normalization', name), await readFile(resolve(docsRoot, '../../plans', name), 'utf8'))),
    writeChanged(resolve(publicRoot, 'reviews/api-normalization/api-10-type-snapshot.md'), await readFile(resolve(docsRoot, '../../plans/api-10-type-snapshot.md'), 'utf8')),
    ...['api-07-target-floors.md', 'api-07-target-floors-verification.json'].map(async name => writeChanged(resolve(publicRoot, 'reviews/api-normalization', name), await readFile(resolve(docsRoot, '../../plans', name), 'utf8'))),
    writeChanged(resolve(publicRoot, 'reviews/api-normalization/api-05-outcomes.md'), await readFile(resolve(docsRoot, '../../plans/api-05-outcomes.md'), 'utf8')),
    writeChanged(resolve(publicRoot, 'reviews/api-normalization/api-08-localization.md'), await readFile(resolve(docsRoot, '../../plans/api-08-localization.md'), 'utf8')),
    writeChanged(resolve(publicRoot, 'reviews/api-normalization/api-04-collections.md'), await readFile(resolve(docsRoot, '../../plans/api-04-collections.md'), 'utf8')),
    writeChanged(resolve(publicRoot, 'reviews/api-normalization/api-02-transactions.md'), await readFile(resolve(docsRoot, '../../plans/api-02-transactions.md'), 'utf8')),
    writeChanged(resolve(publicRoot, 'reviews/api-normalization/api-03-forms.md'), await readFile(resolve(docsRoot, '../../plans/api-03-forms.md'), 'utf8')),
    ...['README.md', 'decisions.md', 'inventory.md', 'inventory.json', 'forms.md', 'overlays.md', 'collections.md', 'editors.md', 'styles.md', 'tooling.md'].map(async name =>
      writeChanged(resolve(publicRoot, 'reviews/api-normalization', name), reviewMarkdown(await readFile(resolve(docsRoot, '../../plans/api-normalization-audit', name), 'utf8')))),
    writeChanged(resolve(publicRoot, 'reviews/content-recipes.md'), await readFile(resolve(docsRoot, '../../packages/primitives/docs/content.md'), 'utf8')),
    writeChanged(resolve(publicRoot, 'reviews/framework-consumption.md'), await readFile(resolve(docsRoot, '../../probes/framework-consumption/README.md'), 'utf8')),
    writeChanged(resolve(publicRoot, 'reviews/data-table-api.md'), await readFile(resolve(docsRoot, '../../packages/elements/src/data-table/README.md'), 'utf8')),
    writeChanged(resolve(publicRoot, 'reviews/table-api.md'), await readFile(resolve(docsRoot, '../../packages/primitives/docs/table.md'), 'utf8')),
    writeChanged(resolve(publicRoot, 'reviews/asset-table.ts'), await readFile(resolve(docsRoot, 'src/workflows/assets/table.ts'), 'utf8')),
    writeChanged(resolve(publicRoot, 'reviews/table-accessibility.md'), await readFile(resolve(docsRoot, '../../plans/table-accessibility-review.md'), 'utf8')),
    ...['custom-elements.json', 'custom-elements.json.receipt.json'].map(async name =>
      writeChanged(resolve(publicRoot, name), await readFile(resolve(docsRoot, '../../packages/elements', name)))),
    ...modules.flatMap(module => [
      writeChanged(resolve(generatedRoot, `${module.name}.js`),
        `// Generated by scripts/prepare-docs.mjs; edit the authored source.\nexport default ${JSON.stringify(module.value)};\n`),
      writeChanged(resolve(generatedRoot, `${module.name}.d.ts`), module.declaration),
    ]),
    ...cssInputs.map(async asset => {
      // Explicit asset preparation retains native CSS syntax; no browser targets
      // are supplied and no JavaScript import is processed as a stylesheet.
      const { code } = transform({ filename: asset.path, code: await readFile(asset.path), minify: true });
      return writeChanged(resolve(publicRoot, asset.href.slice(1)), code);
    }),
  ]);
  await prepareGuides(resolve(docsRoot, '../..'), publicRoot);
  const apiExamples = await generateAPIExamples({ workspaceRoot: resolve(docsRoot, '../..'), docsRoot });
  return { settingsScenarioPages, apiExamplePages: apiExamples.pages, specimens: Object.keys(sourceCatalog).length, workflows: workflows.length,
    stylesheets: cssInputs.map(asset => asset.href), changedFiles: writes.filter(Boolean).length + apiReference.changedFiles.length + apiExamples.changedFiles.length };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  console.log(JSON.stringify(await prepareDocs()));
}
