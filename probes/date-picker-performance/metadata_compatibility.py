"""Apply a recorded metadata compatibility overlay only to a fresh historical stage.

Both subjects receive identical type-only edits. The archived commit and locks
remain controls; this overlay is NOT a claim of historical type-API equality.
Qualification must compare emitted JavaScript against each preserved subject.
"""
from pathlib import Path, PurePosixPath
import hashlib
import json


def sha(data):
    return hashlib.sha256(data).hexdigest()


def replace(text, before, after, count=1):
    if text.count(before) != count:
        raise RuntimeError('Historical metadata token changed: ' + before)
    return text.replace(before, after)


def apply_metadata_compatibility(stage, host, source_parent):
    stage, host = Path(stage).resolve(strict=True), Path(host).resolve(strict=True)
    if stage == host or host.is_relative_to(stage) or (stage.is_relative_to(host) and not stage.is_relative_to(host / 'artifacts')):
        raise RuntimeError('Historical metadata requires a fresh stage outside maintained source')
    if not stage.name.startswith(('phase6-parent-', 'phase6-candidate-')):
        raise RuntimeError('Historical metadata requires a caller-created Phase6 stage')
    spec_path = Path(__file__).with_name('metadata-compatibility.json')
    spec = json.loads(spec_path.read_text())
    if spec['version'] != 1 or spec['sourceParent'] != source_parent:
        raise RuntimeError('Unsupported historical metadata compatibility source')
    originals, edits, kinds = {}, {}, {}

    def physical(name, *, new=False):
        relative = PurePosixPath(name)
        if relative.is_absolute() or '..' in relative.parts or str(relative) != name:
            raise RuntimeError('Unsafe historical metadata path: ' + name)
        path = stage / name
        if path.parent.resolve(strict=True) != path.parent or path.is_symlink():
            raise RuntimeError('Historical metadata path is not physical: ' + name)
        if new:
            if path.exists():
                raise RuntimeError('Historical metadata bridge already exists: ' + name)
        elif not path.is_file():
            raise RuntimeError('Missing historical metadata source: ' + name)
        return path

    def read(name, expected):
        if name in originals:
            raise RuntimeError('Duplicate historical metadata edit: ' + name)
        data = physical(name).read_bytes()
        if sha(data) != expected:
            raise RuntimeError('Historical metadata preimage changed: ' + name)
        originals[name] = data
        return data.decode()

    for row in spec['product']:
        name = row['path']
        value = read(name, row['historicalSha256'])
        for edit in row.get('edits', []):
            value = replace(value, edit['before'], edit['after'])
        value += row.get('append', '')
        edits[name], kinds[name] = value, row['kind']
    for name, expected in spec['toolingHistoricalSha256'].items():
        edits[name], kinds[name] = read(name, expected), 'metadata-compiler-integration'

    def url(name):
        path = host / 'tooling/metadata' / name
        if not path.is_file() or path.is_symlink():
            raise RuntimeError('Missing maintained metadata boundary: ' + name)
        return json.dumps(path.as_uri())

    parts_policy = spec['historicalPartsPolicy']
    if parts_policy['version'] != 1:
        raise RuntimeError('Unsupported historical CSS Parts policy')
    for name, expected in parts_policy['sources'].items():
        if 'sha256:' + sha(physical('packages/elements/' + name).read_bytes()) != expected:
            raise RuntimeError('Historical Parts source changed: ' + name)

    bridge = 'tooling/metadata/compiler-api.mjs'
    physical(bridge, new=True)
    edits[bridge] = '// Shared selected compiler API; no fallback to archived dependencies.\nexport {ts, compilerIdentity, compilerResolution, assertGeneratorCompilerOwners} from ' + url('compiler-api.mjs') + ';\n'
    kinds[bridge] = 'metadata-compiler-bridge'
    # Retain the CLI shell, replacing only the extraction implementation.
    name = 'tooling/metadata/generate.ts'
    old = edits[name]
    start = old.index('export const help =')
    cli = old[start:].replace('The installed CEM analyzer\nextracts actual declarations, with its Lit plugin.', 'The maintained WC Toolkit adapter\nextracts actual declarations through the selected compiler API and Lit plugin.')
    cli = cli.replace('Source files are explicit paths relative to source-root.', 'This historical wrapper requires its own archived elements stage and every policy-bound source. Source files are explicit paths relative to source-root.')
    edits[name] = """import { mkdir, readFile, writeFile, rename, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { randomUUID } from 'node:crypto';
import {digestBytes, digestJson} from '../evidence/identity.ts';
""" + 'import {generateCem as maintainedGenerateCem} from ' + url('generate.ts') + ';\n' + 'export {verifyCandidateReceipt} from ' + url('generate-wc-toolkit.ts') + ';\n' + 'const historicalPartsPolicy = ' + json.dumps(parts_policy) + ';\n' + """
/** Fixed historical rendering policy; extraction identity remains the host's. */
export async function generateCem(options: {sourceRoot: string; sources: string[]; lit?: boolean}) {
  const root = resolve(options.sourceRoot);
  const historicalRoot = fileURLToPath(new URL('../../packages/elements/', import.meta.url));
  if (root !== resolve(historicalRoot)) throw new Error('Historical extraction requires its own elements stage.');
  for (const [source, expected] of Object.entries(historicalPartsPolicy.sources)) {
    if (!options.sources.includes(source) || digestBytes(await readFile(resolve(root, source))) !== expected) throw new Error('Historical Parts policy source changed: ' + source);
  }
  const result = await maintainedGenerateCem(options);
  for (const [source, expected] of Object.entries(historicalPartsPolicy.sources)) {
    if (result.receipt.sources[source] !== expected) throw new Error('Historical Parts extraction snapshot changed: ' + source);
  }
  const policy = applyHistoricalPartsPolicy(result.manifest);
  return {...result, receipt: {...result.receipt, manifestDigest: digestJson(result.manifest), historicalPartsPolicy: policy}};
}

/** Exact reviewed inherited rows only; exported for negative policy controls. */
export function applyHistoricalPartsPolicy(manifest: any) {
  const changes: Array<{declaration: any; parts: string[]}> = [];
  for (const policy of historicalPartsPolicy.omissions) {
    const modules = manifest.modules.filter((entry: any) => entry.path === policy.module);
    if (modules.length !== 1) throw new Error('Ambiguous historical Parts module: ' + policy.module);
    const classes = (modules[0].declarations ?? []).filter((entry: any) => entry.name === policy.className);
    if (classes.length !== 1 || classes[0].kind !== 'class' || classes[0]['x-en-reve-omitted-css-parts'] !== undefined) throw new Error('Historical Parts class policy changed: ' + policy.className);
    const declaration = classes[0];
    for (const name of policy.parts) {
      const parts = (declaration.cssParts ?? []).filter((part: any) => part.name === name);
      if (parts.length !== 1 || digestJson(parts[0]) !== digestJson({name, inheritedFrom: {name: 'MultipleChoice', module: 'src/internal/multiple-choice.ts'}})) throw new Error('Historical Parts row is missing, own or ambiguous: ' + policy.className + '.' + name);
    }
    changes.push({declaration, parts: policy.parts});
  }
  for (const {declaration, parts} of changes) {
    declaration.cssParts = declaration.cssParts.filter((part: any) => !parts.includes(part.name));
    declaration['x-en-reve-omitted-css-parts'] = [...parts].sort();
  }
  return {policy: historicalPartsPolicy, digest: digestJson(historicalPartsPolicy)};
}

""" + cli
    # Host extraction identity remains exact. The archived integration has an
    # additional independent identity, including its subject-specific policy.
    name = 'tooling/metadata/generator-identity.ts'
    edits[name] = """import {readFile, readdir} from 'node:fs/promises';
import {digestBytes} from '../evidence/identity.ts';
""" + 'export {generatorIdentity} from ' + url('generator-identity.ts') + ';\n' + """
/** Hash all archived tooling source, including the compiler bridge and policies. */
export async function historicalMetadataIdentity() {
  const root = new URL('../', import.meta.url), sources: Record<string, string> = {};
  async function visit(relative: string) {
    for (const entry of (await readdir(new URL(relative, root), {withFileTypes: true})).sort((a,b) => a.name.localeCompare(b.name, 'en'))) {
      const path = relative + entry.name;
      if (entry.isSymbolicLink()) throw new Error('Historical tooling source must be physical: ' + path);
      if (entry.isDirectory()) await visit(path + '/');
      else if (entry.isFile() && /\\.(?:[cm]?js|[cm]?ts)$/.test(entry.name)) sources[path] = digestBytes(await readFile(new URL(path, root)));
    }
  }
  await visit('');
  return {version: 1, policy: 'fresh-historical-stage-maintained-generator', sources};
}
"""
    name = 'tooling/metadata/definition-graph.ts'
    edits[name] = replace(edits[name], "await import(pathToFileURL(require.resolve('@custom-elements-manifest/analyzer')).href)", "await import('./compiler-api.mjs')", 2)
    name = 'tooling/metadata/event-contracts.ts'
    edits[name] = replace(edits[name], "await import(pathToFileURL(createRequire(import.meta.url).resolve('@custom-elements-manifest/analyzer')).href)", "await import('./compiler-api.mjs')")
    edits[name] = 'import {relativeImportTypes} from ' + url('type-text.ts') + ';\n' + edits[name]
    edits[name] = replace(edits[name], 'detail: checker.typeToString(checker.getTypeOfSymbolAtLocation(detail, alias), alias, ts.TypeFormatFlags.NoTruncation)', 'detail: relativeImportTypes(checker.typeToString(checker.getTypeOfSymbolAtLocation(detail, alias), alias, ts.TypeFormatFlags.NoTruncation), source.fileName, ts)')
    name = 'tooling/metadata/type-snapshot.ts'
    edits[name] = replace(edits[name], "const { ts } = await import(pathToFileURL(createRequire(import.meta.url).resolve('@custom-elements-manifest/analyzer')).href);", "const {ts, compilerIdentity} = await import('./compiler-api.mjs');")
    edits[name] = replace(edits[name], 'generator: { version: 1; typescript: string; digest: string };', 'generator: { version: 2; typescript: string; digest: string; compiler: unknown };')
    edits[name] = replace(edits[name], 'generator: { version: 1, typescript: ts.version, digest:', 'generator: { version: 2, typescript: ts.version, compiler: compilerIdentity(), digest:')
    name = 'tooling/customization/source-inventory.mjs'
    edits[name] = replace(edits[name], "import { ts } from '@custom-elements-manifest/analyzer';", "import {ts} from '../metadata/compiler-api.mjs';")
    name = 'tooling/metadata/generate-elements.ts'
    edits[name] = replace(edits[name], "import {generatorIdentity} from './generator-identity.ts';", "import {generatorIdentity, historicalMetadataIdentity} from './generator-identity.ts';")
    edits[name] = replace(edits[name], "import { generateCem } from './generate.ts';", "import {generateCem, verifyCandidateReceipt} from './generate.ts';")
    edits[name] = replace(edits[name], 'const receipt = { ...generated.receipt, eventContracts, generator:', 'const receipt = { ...generated.receipt, historicalMetadata: await historicalMetadataIdentity(), eventContracts, generator:')
    needle = "  const customization = await readCustomizationState();\n  if (customization.registryDigest !== receipt.customization?.registryDigest"
    edits[name] = replace(edits[name], needle, """  await verifyCandidateReceipt(manifest, receipt, {sourceRoot: packageRoot, sources});
  if (digestJson(receipt.historicalMetadata) !== digestJson(await historicalMetadataIdentity())) throw new Error('Historical metadata integration changed; regenerate the CEM.');
  const fresh = await generateElements(packageRoot);
  if (digestJson(fresh.manifest) !== receipt.manifestDigest || digestJson(fresh.receipt.eventContracts) !== digestJson(receipt.eventContracts) || digestJson(fresh.receipt.coverage) !== digestJson(receipt.coverage) || digestJson(fresh.receipt.historicalPartsPolicy) !== digestJson(receipt.historicalPartsPolicy)) throw new Error('Historical imported contracts or resolution changed; regenerate the CEM.');
  const customization = await readCustomizationState();
  if (customization.registryDigest !== receipt.customization?.registryDigest""")

    # Validate every source before the first write. Only the caller-created
    # stage is mutable, and caller persists all preimages with its run output.
    for name, data in originals.items():
        if physical(name).read_bytes() != data:
            raise RuntimeError('Historical metadata preimage raced: ' + name)
    physical(bridge, new=True)
    rows = []
    for name, value in edits.items():
        data = value.encode()
        (stage / name).write_bytes(data)
        rows.append({'path': name, 'kind': kinds[name],
                     'historicalSha256': sha(originals[name]) if name in originals else None,
                     'executedSha256': sha(data),
                     'historicalSourceCopy': 'historical-metadata-files/' + name if name in originals else None})
    identity = {'status': 'maintained-adapter-selected-qualification-required',
                'sourceParent': source_parent, 'specSha256': sha(spec_path.read_bytes()),
                'helperSha256': sha(Path(__file__).read_bytes()), 'overlay': rows,
                'typeApiChange': '25 explicitly recorded type exports; one erased event-detail assertion',
                'runtimeEquality': 'requires sealed packed-control comparison',
                'archivedRootManifestAndLockUnchangedByMetadataOverlay': True,
                'historicalPartsPolicy': parts_policy}
    return rows, originals, identity
