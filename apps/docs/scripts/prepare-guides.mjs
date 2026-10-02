import { readFile, mkdir, writeFile, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

/** Publish only the curated portable skills and the identities of public contracts. */
export async function prepareGuides(workspaceRoot, publicRoot) {
  const artifacts = [];
  for (const file of ['custom-elements.json', 'custom-elements.json.receipt.json', 'public-api.json', 'public-types.json']) {
    const bytes = await readFile(resolve(publicRoot, file));
    artifacts.push({ href: `/${file}`, sha256: createHash('sha256').update(bytes).digest('hex'), bytes: bytes.length });
  }
  const catalog = JSON.parse(await readFile(resolve(workspaceRoot, 'skills/catalog.json'), 'utf8'));
  if (catalog.schemaVersion !== 1 || !Array.isArray(catalog.skills)) throw new Error('Invalid skill catalog');
  // This directory contains generated assets only; removed skills must not remain downloadable.
  await rm(resolve(publicRoot, 'guides'), { recursive: true, force: true });
  const seen = new Set();
  const skills = [];
  for (const entry of catalog.skills) {
    const { name, title, responsibility, boundary } = entry;
    if (!/^en-reve-[a-z-]+$/.test(name) || seen.has(name) || !title || !responsibility || !boundary) throw new Error('Invalid or duplicate skill entry');
    seen.add(name);
    const source = `skills/${name}/SKILL.md`;
    const bytes = await readFile(resolve(workspaceRoot, source));
    const dir = resolve(publicRoot, 'guides/skills', name);
    await mkdir(dir, { recursive: true });
    await writeFile(resolve(dir, 'SKILL.md'), bytes);
    skills.push({ name, title, responsibility, boundary, source, href: `/guides/skills/${name}/SKILL.md`, sha256: createHash('sha256').update(bytes).digest('hex'), bytes: bytes.length });
  }
  const index = {
    schemaVersion: 1,
    guide: '/guides.html',
    identity: 'SHA-256 of the delivered bytes. Use the complete artifact set from one build and compare it to the installed package; hashes do not establish behavioral support.',
    artifacts, skills,
    examples: '/api-examples',
    api: '/api-reference',
    support: 'https://github.com/Westbrook/en-reve/blob/main/plans/support-coverage.md',
    sourceReference: 'GitHub main links are mutable. Pin a source commit for release or support decisions.',
  };
  await writeFile(resolve(publicRoot, 'guides/contract-index.json'), JSON.stringify(index, null, 2) + '\n');
}
