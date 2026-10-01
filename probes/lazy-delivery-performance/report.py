"""Write a sortable packed en-table report, with exact raw receipts beside it."""
from pathlib import Path
import argparse, hashlib, html, json, shutil
parser = argparse.ArgumentParser()
parser.add_argument('--run', required=True)
args = parser.parse_args()
run = Path(args.run).resolve()

def expect(condition, message):
    if not condition:
        raise ValueError(message)


def file_digest(path):
    with Path(path).open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


def within(root, name):
    expect(isinstance(name, str) and name and not Path(name).is_absolute(), 'Expected relative evidence path')
    path = (root / name).resolve()
    expect(path.is_relative_to(root) and path != root, 'Evidence path escapes its root: ' + name)
    return path


inputs = {}
def remember(path, expected):
    path = Path(path).resolve()
    actual = file_digest(path)
    expect(actual == expected, 'Original evidence changed: ' + str(path))
    expect(path not in inputs or inputs[path] == actual, 'Input changed during presentation: ' + str(path))
    inputs[path] = actual
    return actual


def read_bound(path, expected=...):
    path = Path(path).resolve()
    value = path.read_bytes()
    actual = hashlib.sha256(value).hexdigest()
    expect(expected is ... or actual == expected, 'Original evidence changed: ' + str(path))
    expect(path not in inputs or inputs[path] == actual, 'Input changed during presentation: ' + str(path))
    inputs[path] = actual
    return json.loads(value)


def copy_bound(source, target):
    expected = inputs[source.resolve()]
    value = source.read_bytes()
    expect(hashlib.sha256(value).hexdigest() == expected, 'Input changed before copy: ' + str(source))
    target.parent.mkdir(parents=True, exist_ok=True)
    with target.open('xb') as stream:
        stream.write(value)
    expect(file_digest(target) == expected and file_digest(source) == expected, 'Evidence copy changed: ' + str(source))


def verify_assets(root, inventory):
    declared = {item['path']: item for item in inventory}
    expect(len(declared) == len(inventory) and declared, 'Missing/duplicate report asset paths')
    expect(set(declared) == {path.relative_to(root).as_posix() for path in root.rglob('*') if path.is_file()}, 'Report asset file set changed')
    for name, item in declared.items():
        path = within(root, name)
        expect(file_digest(path) == item['sha256'], 'Report asset changed: ' + name)
    expect('boot.js' in declared, 'Report entry is not sealed')


data = read_bound(run / 'analysis.json')
manifest = read_bound(run / 'manifest.json', data['sourceManifestSha256'])
remember(run / 'samples.jsonl', data['rawSha256'])
# Current analyses bind the completion summary; never manufacture that attestation for old outputs.
expect('summarySha256' in data, 'Current report requires summarySha256; reanalyze original inputs with the current analyzer without patching historical evidence')
remember(run / 'summary.json', data['summarySha256'])
prepared = Path(manifest['preparation']['path']).resolve()
preparation = read_bound(prepared / 'manifest.json', manifest['preparation']['sha256'])
expect(preparation == manifest['preparation']['identity'], 'Prepared identity differs from acquisition')
expect(preparation.get('status') == 'complete', 'Incomplete packed preparation')
protected = [prepared]
for source in preparation.get('sources', {}).values():
    for key in ('snapshot', 'origin'):
        if source.get(key):
            protected.append(Path(source[key]).resolve())
expect(not any(run.is_relative_to(path) for path in protected), 'Report output cannot alter prepared/source inputs')
report_arms = [value for value in preparation['variants'] if value['family'] == 'report']
expect(len(report_arms) == 1, 'Matched preparation must include exactly one packed en-table report asset arm')
report_arm = report_arms[0]
assets = run / 'report-assets'
evidence = run / 'prepared-evidence'
for target in (assets, evidence, run / 'report.html', run / 'report-receipt.json'):
    expect(not target.exists() and not target.is_symlink(), 'Report output is immutable; use fresh report output leaves')
evidence_files = [(prepared / 'manifest.json', evidence / 'manifest.json')]
packages = {}
report_receipt = None
analyzed_assets = {item['variant']: item for item in data['assets']}
expect(len(analyzed_assets) == len(data['assets']) and set(analyzed_assets) == {variant['id'] for variant in preparation['variants']}, 'Analysis receipt inventory differs from preparation')
for variant in preparation['variants']:
    receipt_name = variant.get('receipt', variant.get('root', variant['id']) + '/receipt.json')
    receipt_path = within(prepared, receipt_name)
    analyzed_hash = analyzed_assets[variant['id']]['receiptSha256']
    # Preserve an analyzer-recorded invalid receipt; reject mutations after that analysis.
    receipt = read_bound(receipt_path, analyzed_hash)
    if variant == report_arm:
        expect(analyzed_hash == variant['receiptSha256'], 'Packed report receipt is not valid for presentation')
    evidence_files.append((receipt_path, within(evidence, receipt_name)))
    package_path = within(prepared, receipt['packagesReceipt'])
    remember(package_path, receipt['packagesReceiptSha256'])
    packages[receipt['packagesReceipt']] = package_path
    if variant == report_arm:
        report_receipt = receipt
for arm in ('reference', 'candidate'):
    package_name = arm + '/packages.json'
    expect(package_name in packages, 'Missing exact package receipt: ' + arm)
    evidence_files.append((packages[package_name], evidence / package_name))
asset_root = within(prepared, report_arm.get('root', report_arm['id'])) / 'site'
asset_root = asset_root.resolve()
expect(asset_root.is_relative_to(prepared), 'Report asset root escapes preparation')
verify_assets(asset_root, report_receipt['assets'])
for source, expected in inputs.items():
    expect(file_digest(source) == expected, 'Input changed before output: ' + str(source))
shutil.copytree(asset_root, assets)
verify_assets(assets, report_receipt['assets'])
evidence.mkdir()
for source, target in evidence_files:
    copy_bound(source, target)
escape = lambda value: html.escape(str(value), quote=True)
def display(value):
    if value is None: return '—'
    if isinstance(value, float): return f'{value:,.2f}'.rstrip('0').rstrip('.')
    if isinstance(value, int): return f'{value:,}'
    return escape(value)
def table(identifier, title, rows, columns, note):
    headings = ''.join(f'<th scope="col"><button disabled data-index="{i}" data-type="{"number" if numeric else "text"}">{escape(label)}</button></th>' for i, (key, label, numeric) in enumerate(columns))
    body = ''.join('<tr data-order="' + str(i) + '">' + ''.join(f'<td data-value="{escape(row.get(key) if row.get(key) is not None else "")}">{display(row.get(key))}</td>' for key, _, _ in columns) + '</tr>' for i, row in enumerate(rows))
    return f'<section id="{identifier}" data-comparison><h2>{title}</h2><label class="search">Filter rows <input type="search" placeholder="Type a browser, metric or policy"></label><en-table label="{title}"><table aria-describedby="{identifier}-direction"><caption>{title}</caption><thead><tr>{headings}</tr></thead><tbody>{body}</tbody></table></en-table><p id="{identifier}-direction" class="direction">{note}</p><p role="status" aria-live="polite">{len(rows)} rows</p></section>'
rows = [dict(r, registry=r['requestedMode'] + ' → ' + r['actualMode'], low=r['interval'][0], high=r['interval'][1], spread=display(r['minimum']) + ' … ' + display(r['maximum'])) for r in data['rows']]
columns = [('candidate', 'Candidate', False), ('reference', 'Matched reference', False), ('browser', 'Engine', False), ('profile', 'Profile', False), ('input', 'Input', False), ('registry', 'Requested → actual registry', False), ('metric', 'Metric', False), ('n', 'n / arm', True), ('referenceMedian', 'Reference median', True), ('median', 'Candidate median', True), ('delta', 'Candidate − reference Δ', True), ('deltaPercent', 'Change %', True), ('low', '95% Δ lower', True), ('high', '95% Δ upper', True), ('p75', 'Candidate p75', True), ('p95', 'Candidate p95 (n ≥ 100)', True), ('spread', 'Candidate min … max', False)]
notes = '<strong>Better sign for every change column:</strong> Negative Δ, change %, and lower/upper Δ bounds mean less latency, fewer connected nodes, fewer requests or fewer encoded bytes. Positive values add cost. Preparation lead is observed scheduling time: no direction is inherently better. Intervals crossing zero establish no direction or equivalence. All intervals are exploratory matched-block bootstrap estimates without multiple-comparison correction. A following frame opportunity does not establish paint. — means unavailable; p95 requires at least 100 samples.'
content = f'<header><p class="eyebrow">En Rêve · explicit optional delivery</p><h1>Fresh matched delivery evidence</h1><p class="lede">API overhead, existing date-feature migration and optional-feature cost are separate comparisons. No historical acceptance is inherited.</p><p class="gate">Automated campaign status: <strong>{escape(data["automatedGate"])}</strong> · complete acquisition: {escape(data["complete"])} · full Stage B matrix: {escape(data["fullStageBMatrix"])}</p><nav><a href="#api">API overhead</a><a href="#migration">Profile migration</a><a href="#date">Date feature</a><a href="#retention">Retention</a><a href="#provenance">Raw evidence</a><a href="http://127.0.0.1:4177/">Progress Report</a></nav></header>'
content += f'<section><h2>Scope and qualification</h2><p>{data["successfulTiming"]:,} successful timing observations; {data["successfulRetention"]:,} separate retention contexts; {len(data["failedOrAborted"])} failed/aborted records retained. Qualification-only run: {escape(data["qualification"])}. A partial matrix does not establish a full rollout qualification.</p><p>The date workload is one production single-date field, with fresh current reference and candidate packages. It is not whole-route benefit. Cold and immediate policies that miss readiness budgets remain diagnostic; they cannot become a latency recommendation. Contextual-toolbar and other family decisions require their own declared consumers and gates. Browser focus and emulated touch do not establish assistive-technology speech or physical-device acceptance.</p></section>'
decisions = data.get('decisions', {})
policy_rows = [dict(item, benefit=item['benefit']['status'], latency=item['latency']['status'], delivery=item.get('delivery', {}).get('status', 'unavailable'), migration=item['migration']['status'], retention=item['retention']['status']) for item in decisions.get('datePolicies', [])]
content += '<section><h2>Independent decisions</h2><p>API overhead: <strong>' + escape(decisions.get('apiOverhead', {}).get('status', 'unavailable')) + '</strong>. Cold or immediate-policy latency failures remain in the raw gate table and qualify only as diagnostics; they do not erase an independently qualified API result or become a whole-rollout pass.</p><p>' + escape(decisions.get('rolloutAcceptance', 'No rollout acceptance inferred.')) + '</p></section>'
content += table('policy-decisions', 'Date policy decisions', policy_rows, [('variant', 'Arm / policy', False), ('matrixComplete', 'Own matrix complete', False), ('migration', 'Profile migration', False), ('benefit', 'Component benefit', False), ('latency', 'Latency', False), ('delivery', 'Unused / abandoned bytes', False), ('retention', 'Retention', False), ('recommendation', 'Bounded conclusion', False)], '<strong>Better sign:</strong> This table contains categorical decisions, not delta values. Every underlying numeric bound and failure remains in its comparison and raw gate row. A qualified fixture has no automatic route, speech or other-family acceptance.')
for identifier, title, kind in [('api', 'API overhead only', 'api-overhead'), ('migration', 'Existing shell → common profile migration', 'migration'), ('date', 'Date policies against matched same-source eager controls', 'date-benefit')]:
    content += table(identifier, title, [row for row in rows if row['kind'] == kind], columns, notes)
retention = [dict(r, registry=r['requestedMode'] + ' → ' + r['actualMode']) for r in data['retention']]
content += table('retention', 'Separate 100-cycle retention repetitions', retention, [('variant', 'Arm', False), ('registry', 'Registry', False), ('block', 'Fresh repetition', True), ('heapDelta', 'Heap 100 − 10 Δ bytes', True), ('nodeDelta', 'Nodes 100 − 10 Δ', True), ('listenerDelta', 'Listeners 100 − 10 Δ', True), ('documentDelta', 'Documents 100 − 10 Δ', True), ('documentsAt100', 'Documents at 100', True)], '<strong>Better sign for every change column:</strong> Negative heap, node, listener and document Δ means less retained cost; positive Δ means added retention. Changes are cycle 100 minus cycle 10 after 300 ms settling and double garbage collection. Every repetition remains visible. Modules and registry definitions intentionally remain resident. Five contexts do not establish absence of leaks. Documents at 100 is an absolute count; document growth is reported without a numeric gate.')
asset_by_id = {r['variant']: r for r in data['assets']}
asset_rows = []
for row in data['assets']:
    reference = asset_by_id.get(row['variant'].replace('candidate/', 'reference/', 1)) if row['variant'].startswith('candidate/') else None
    asset_rows.append(dict(row, startupDelta=(row['startupGzipBytes'] - reference['startupGzipBytes']) if reference and row['startupGzipBytes'] is not None and reference['startupGzipBytes'] is not None else None))
content += table('assets', 'Deterministic emitted JavaScript costs', asset_rows, [('variant', 'Packed fixture', False), ('family', 'Purpose', False), ('startupGzipBytes', 'Static entry gzip bytes', True), ('startupDelta', 'Candidate − reference static entry Δ', True), ('declaredShellGzipBytes', 'Declared shell gzip bytes', True), ('allEmittedGzipBytes', 'All emitted JS gzip bytes', True), ('receiptSha256', 'Exact receipt SHA256', False)], '<strong>Better sign:</strong> Smaller byte counts and negative static-entry Δ mean less compressed code; positive Δ adds bytes. Static entry is the static JavaScript/CSS import closure of boot.js. Declared shell additionally includes the date shell and its static dependencies when loaded dynamically during boot; its file inventory is retained in analysis.json. The startupJSBytes timing rows separately measure completed encoded JavaScript traffic at shell readiness. All-emitted JavaScript includes optional chunks. Gzip uses the frozen encoder level. Metadata and report assets are not timed component behavior.')
checks = [dict(c, low=c.get('interval', [None, None])[0] if c.get('interval') else None, high=c.get('interval', [None, None])[1] if c.get('interval') else None) for c in data['checks']]
content += table('gates', 'Predeclared gate results', checks, [('id', 'Gate / exact cell', False), ('status', 'Result', False), ('value', 'Observed value', True), ('maximum', 'Maximum', True), ('minimum', 'Minimum', True), ('n', 'Timing n', True), ('low', '95% lower', True), ('high', '95% upper', True), ('alternative', 'OR alternative', False)], '<strong>Better sign for values and bounds:</strong> Cost deltas prefer smaller or negative values. Component-benefit-nodes and component-benefit-js are reduction percentages: larger or positive values are better, and their frozen minima are 40% and 10%. Either alternative must meet its own minimum with its lower uncertainty bound. Component-benefit aggregates the larger fraction of these frozen minima: 1 means the minimum is met; larger is better. A losing OR alternative does not fail a passing aggregate. An uncertain or missing result is not a pass. A primary median failure requires a changed candidate and a complete new campaign. No favorable cell replacement or relaxed gate is permitted.')
source_text = json.dumps(manifest['preparation']['identity'].get('sources', {}), indent=2)
# Keep the HTML compact; full source inventories remain in the adjacent manifest.
source_brief = {name: {'git': value.get('git'), 'sourceSha256': value.get('sourceSha256'), 'sealSha256': value.get('sealSha256')} for name, value in manifest['preparation']['identity'].get('sources', {}).items()}
content += f'<section id="provenance"><h2>Exact source, raw observations and limits</h2><p><a href="samples.jsonl">Every sample attempt (JSONL)</a> · <a href="manifest.json">Campaign/source/runtime/browser/harness manifest</a> · <a href="summary.json">Acquisition completion</a> · <a href="analysis.json">All comparisons and gate calculations</a> · <a href="prepared-evidence/manifest.json">Packed build manifest</a> · <a href="prepared-evidence/reference/packages.json">Reference packages</a> · <a href="prepared-evidence/candidate/packages.json">Candidate packages</a></p><pre>{escape(json.dumps(source_brief, indent=2))}</pre><p>Raw JSONL SHA256: <code>{escape(data["rawSha256"])}</code>. Campaign manifest SHA256: <code>{escape(data["sourceManifestSha256"])}</code>. Exact original prepared artifact root: <code>{escape(str(prepared))}</code>.</p><p>Host: {escape(manifest["host"])}. Environment/declared contention: {escape(manifest["environment"])}.</p><ul>' + ''.join(f'<li>{escape(note)}</li>' for note in data['limits']) + '</ul><p>Reports present evidence for review. User review state is maintained separately in the established Progress Report; this report never marks content reviewed.</p></section>'
css = 'html{color-scheme:light}body{margin:0;background:#f3f6f0;color:#19372b;font:15px/1.55 system-ui}main{max-width:1600px;margin:auto;padding:40px 28px}header{padding:30px;background:#e1eddf;border-radius:16px}h1{font-size:clamp(30px,4vw,50px);line-height:1.1;margin:.4em 0}h2{font-size:23px}p{max-width:110ch}a{color:#165840}nav{display:flex;gap:20px;flex-wrap:wrap}.eyebrow{text-transform:uppercase;letter-spacing:.13em;font-size:12px}.lede{font-size:19px}section{margin:32px 0;padding:24px;background:white;border:1px solid #dbe5d8;border-radius:12px}.search{display:block;margin-bottom:15px}input{font:inherit;padding:7px;border:1px solid #94ad9b;border-radius:4px;min-width:280px}en-table{display:block;overflow-x:auto}table{border-collapse:collapse;min-width:100%;font-size:13px}caption{text-align:left;font-weight:600;margin-bottom:10px}th,td{padding:9px;text-align:left;vertical-align:top;border-bottom:1px solid #e0e8dd}th{background:#edf3e9;white-space:nowrap}th button{font:inherit;font-weight:600;color:inherit;border:0;background:transparent;text-align:left;cursor:pointer}th[aria-sort=ascending] button:after{content:" ↑"}th[aria-sort=descending] button:after{content:" ↓"}td{font-variant-numeric:tabular-nums}tr[hidden]{display:none}.direction{font-size:13px;color:#3c5647;padding:12px;background:#f0f5ec;border-left:3px solid #507f61}pre{overflow:auto;font-size:12px}.gate{font-size:16px}code{overflow-wrap:anywhere}'
output = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>En Rêve · Fresh lazy delivery evidence</title><style>' + css + '</style></head><body><main>' + content + '</main><script type="module" src="./report-assets/boot.js"></script></body></html>'
with (run / 'report.html').open('x') as stream:
    stream.write(output)
expect(file_digest(run / 'report.html') == hashlib.sha256(output.encode()).hexdigest(), 'Report readback changed')
for source, expected in inputs.items():
    expect(file_digest(source) == expected, 'Input changed during presentation: ' + str(source))
verify_assets(asset_root, report_receipt['assets'])
verify_assets(assets, report_receipt['assets'])
for source, target in evidence_files:
    expect(file_digest(target) == inputs[source.resolve()], 'Copied evidence changed during presentation: ' + str(target))
with (run / 'report-receipt.json').open('x') as stream:
    stream.write(json.dumps({'report': 'report.html', 'sha256': file_digest(run / 'report.html'), 'reportAssetReceipt': report_arm.get('receipt'), 'reportAssetReceiptSha256': report_arm.get('receiptSha256'), 'analysisSha256': inputs[(run / 'analysis.json').resolve()], 'inputs': {str(path): value for path, value in inputs.items()}}, indent=2) + '\n')
print(run / 'report.html')
