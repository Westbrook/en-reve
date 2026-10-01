import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Opt-in destination for nested gates; distinct configurations retain distinct receipts. */
export function pipelineOutput(configURL) {
  const root = process.env.EN_TEST_PIPELINE_OUTPUT;
  const mapping=process.env.EN_TEST_PIPELINE_CONFIG_OUTPUTS ? JSON.parse(process.env.EN_TEST_PIPELINE_CONFIG_OUTPUTS) : {};
  const selected=mapping[configURL];
  if (selected !== undefined && typeof selected !== 'string') throw new Error('Invalid explicit configuration output destination');
  if (!root && !selected) return {};
  const id = createHash('sha256').update(configURL).digest('hex').slice(0, 12);
  const output = selected ? resolve(selected) : resolve(root, id);
  return { outputDir: resolve(output, 'artifacts'), reporter: [
    ['list'],
    ['json', { outputFile: resolve(output, 'playwright.json') }],
    [fileURLToPath(new URL('../testing/facet-reporter.mjs', import.meta.url)), { outputFile: resolve(output, 'facets.json') }],
  ] };
}
