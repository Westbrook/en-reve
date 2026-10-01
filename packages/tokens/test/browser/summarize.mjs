import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const report = JSON.parse(await readFile(new URL('./evidence/playwright.json',import.meta.url),'utf8'));
const measurements = [];
function visit(suite) {
  for (const spec of suite.specs ?? []) for (const test of spec.tests) for (const result of test.results) {
    for (const attachment of result.attachments ?? []) if (attachment.contentType === 'application/json' && attachment.body) {
      measurements.push({test:spec.title,scenario:attachment.name,...JSON.parse(Buffer.from(attachment.body,'base64').toString())});
    }
  }
  for (const child of suite.suites ?? []) visit(child);
}
for (const suite of report.suites) visit(suite);
const paths = ['src/graph.ts','src/source.ts','src/sizing.ts','src/recipes.ts','dist/default.css','test/browser/scopes.spec.mjs','test/browser/sizes.spec.mjs','test/browser/stable-page.mjs'];
const sha256 = Object.fromEntries(await Promise.all(paths.map(async path => [path,createHash('sha256').update(await readFile(new URL(`../../${path}`,import.meta.url))).digest('hex')])));
await writeFile(new URL('./evidence/computed-styles.json',import.meta.url),JSON.stringify({stats:report.stats,sha256,measurements},null,2)+'\n');
console.log(JSON.stringify({stats:report.stats,versions:Object.fromEntries(measurements.map(entry => [entry.engine,entry.version]))},null,2));
