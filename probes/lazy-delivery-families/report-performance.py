"""Render fresh immutable family evidence with an explicitly registered packed en-table.

python report-performance.py --analysis=/analysis-output --out=/fresh-report
This report never acquires measurements or marks any work reviewed.
"""
from pathlib import Path
import argparse
import html
import importlib.util
import json
import shutil
import sys

sys.dont_write_bytecode = True  # The sealed harness inventory must not gain __pycache__.

module = importlib.util.spec_from_file_location('family_analysis', Path(__file__).with_name('analyze-performance.py'))
analysis = importlib.util.module_from_spec(module)
module.loader.exec_module(analysis)


def escape(value):
    return html.escape(str(value), quote=True)


def display(value):
    if value is None:
        return '—'
    if isinstance(value, float):
        return f'{value:,.3f}'.rstrip('0').rstrip('.')
    if isinstance(value, int) and not isinstance(value, bool):
        return f'{value:,}'
    if isinstance(value, (dict, list)):
        return escape(json.dumps(value, ensure_ascii=False))
    return escape(value)


DELTA_NOTES = [
    ('Comparator', 'Every signed Δ is the named after arm minus the named before arm. Candidate−reference, candidate−rollback and rollback−reference are separate matched blocks; negative cost changes are better.'),
    ('Units and statistic', 'Time is milliseconds, size is bytes, requests/elements/all nodes are counts. Change % divides the signed change by its own comparator statistic. DOM benefits are median reductions; latency gates use p75. Reference and candidate spread is min…max; IQR and standard deviation remain in analysis.json.'),
    ('Uncertainty', 'Signed changes use 95% paired matched-block bootstrap intervals. Absolute p75 limits use a one-sided 95% exact-binomial order-statistic upper bound, under independent observations. Point estimates and applicable bounds must satisfy every gate. No multiple-comparison correction; crossing zero establishes no directional benefit and crossing a gate is uncertain.'),
    ('Unavailable evidence', '— means unavailable, never zero. p95 requires at least 100 samples in that cell. Missing metrics, incomplete matrices, failures, aborts and qualification-only runs cannot pass.'),
]


def table(identifier, title, rows, columns, notes=()):
    headings = ''.join(f'<th scope="col"><button disabled data-index="{index}" data-type="{"number" if numeric else "text"}">{escape(label)}</button></th>'
                       for index, (_, label, numeric) in enumerate(columns))
    body = ''.join('<tr data-order="' + str(index) + '">' + ''.join(
        f'<td data-value="{escape(row.get(key) if row.get(key) is not None else "")}">{display(row.get(key))}</td>'
        for key, _, _ in columns) + '</tr>' for index, row in enumerate(rows))
    note_html = '<dl class="notes direction" id="' + identifier + '-notes">' + ''.join(
        '<div><dt>' + escape(('Better sign and scope: ' if index == 0 else '') + label) + '</dt><dd>' + escape(note) + '</dd></div>' for index, (label, note) in enumerate(notes)) + '</dl>' if notes else ''
    return (f'<section id="{identifier}" data-table data-comparison><h2>{escape(title)}</h2>'
            '<label class="filter">Filter rows <input type="search" placeholder="Engine, metric, gate or arm"></label>'
            f'<en-table label="{escape(title)}"><table aria-describedby="{identifier}-notes"><caption>{escape(title)}</caption>'
            f'<thead><tr>{headings}</tr></thead><tbody>{body}</tbody></table></en-table>{note_html}'
            f'<p role="status" aria-live="polite">{len(rows)} rows</p></section>')


def comparison_rows(rows):
    return [dict(row, referenceMedian=row['reference']['median'], candidateMedian=row['candidate']['median'],
                 referenceP75=row['reference']['p75'], candidateP75=row['candidate']['p75'],
                 candidateP95=row['candidate']['p95'], referenceP95=row['reference']['p95'],
                 candidateP75Upper=analysis.get(row, 'candidateP75UpperBound.upper'),
                 referenceSpread=f"{display(row['reference']['min'])}…{display(row['reference']['max'])}",
                 candidateSpread=f"{display(row['candidate']['min'])}…{display(row['candidate']['max'])}",
                 medianLow=(row['medianUncertainty']['delta'] or [None, None])[0],
                 medianHigh=(row['medianUncertainty']['delta'] or [None, None])[1],
                 p75Low=(row['p75Uncertainty']['delta'] or [None, None])[0],
                 p75High=(row['p75Uncertainty']['delta'] or [None, None])[1]) for row in rows]


def preparation_rows(observations):
    """Keep each acquisition row and operation visible; never aggregate delivery policies."""
    rows, operations = [], []
    for observation in observations:
        row = dict(observation)
        original_operations = observation.get('operations') or []
        def unique_operation(kind):
            matches = [operation for operation in original_operations if isinstance(operation, dict) and operation.get('kind') == kind]
            return matches[0] if len(matches) == 1 else {}
        policy = observation.get('deliveryPolicy', '')
        load = unique_operation('prepare' if policy.startswith('prepared-') or policy == 'unused' else 'route-entry')
        ensure = unique_operation('ensure' if policy == 'same-code' else 'activation-ensure')
        controlled = ensure if policy == 'same-code' else load if policy.startswith('prepared-') or policy == 'unused' else {}
        for name, operation in (('load', load), ('ensure', ensure), ('preparation', controlled)):
            row[name + 'StartedAt'] = operation.get('startedAt')
            row[name + 'CompletedAt'] = operation.get('completedAt')
            row[name + 'Status'] = operation.get('status')
        for phase in ('before', 'completion', 'final'):
            for field in ('entryGzipBytes', 'entryRequests', 'settledGzipBytes', 'settledRequests', 'encodedBodyBytes', 'transferBytes'):
                row[phase + '-' + field] = analysis.get(observation, 'traffic.' + phase + '.' + field)
        row['completionAddedGzipBytes'] = analysis.get(observation, 'traffic.additionalGzipBytes')
        row['completionAddedRequests'] = analysis.get(observation, 'traffic.additionalRequests')
        for field, label in (('settledGzipBytes', 'finalAddedGzipBytes'), ('settledRequests', 'finalAddedRequests')):
            before, final = row['before-' + field], row['final-' + field]
            row[label] = final - before if analysis.numeric(before) and analysis.numeric(final) else None
        rows.append(row)
        context = {key: observation.get(key) for key in ('deliveryPolicy', 'browser', 'profile', 'action', 'arm', 'block', 'valid')}
        for operation in original_operations:
            if not isinstance(operation, dict):
                operations.append({**context, 'operationError': 'Malformed operation retained: ' + str(operation)})
                continue
            start, end = operation.get('startedAt'), operation.get('completedAt')
            operations.append({**context, 'operationId': operation.get('id'), 'operationKind': operation.get('kind'),
                               'operationStatus': operation.get('status'), 'operationStartedAt': start, 'operationCompletedAt': end,
                               'operationDurationMs': end - start if analysis.numeric(start) and analysis.numeric(end) else None,
                               'registrationBefore': operation.get('registrationBefore'), 'registrationAfter': operation.get('registrationAfter'),
                               'focusUnchanged': operation.get('focusUnchanged'), 'operationError': operation.get('error')})
    return rows, operations


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--analysis', required=True)
    parser.add_argument('--out', required=True)
    args = parser.parse_args()
    source, output = Path(args.analysis).resolve(), Path(args.out).resolve()
    analysis.expect(not output.exists() and not output.is_symlink(), 'Report output must be fresh')
    bound_inputs = {}
    def read_bound(path, expected=...):
        path = Path(path).resolve()
        value = path.read_bytes()
        digest = analysis.digest(value)
        analysis.expect(expected is ... or digest == expected, 'Original evidence changed: ' + str(path))
        analysis.expect(path not in bound_inputs or bound_inputs[path] == digest, 'Input changed during presentation')
        bound_inputs[path] = digest
        return json.loads(value)
    def bind(path, expected):
        path = Path(path).resolve()
        analysis.expect(analysis.file_digest(path) == expected, 'Original evidence changed: ' + str(path))
        analysis.expect(path not in bound_inputs or bound_inputs[path] == expected, 'Input changed during presentation')
        bound_inputs[path] = expected
    receipt = read_bound(source / 'analysis-receipt.json')
    data = read_bound(source / 'analysis.json', receipt['analysisSha256'])
    analysis.expect(data['kind'] == 'actual-route-family-performance-analysis', 'Wrong analysis kind')
    analysis.expect(analysis.file_digest(Path(__file__).with_name('analyze-performance.py')) == receipt['analyzerSha256'], 'Analyzer source differs from recorded analysis')
    prepared = Path(data['prepared']).resolve()
    preparation = read_bound(prepared / 'manifest.json', data['preparedManifestSha256'])
    protected = [source, prepared]
    for declared in preparation.get('sources', {}).values():
        for key in ('snapshot', 'origin'):
            if declared.get(key):
                protected.append(Path(declared[key]).resolve())
    for provenance in data['provenance'].values():
        if isinstance(provenance, dict) and provenance.get('path'):
            protected.append(Path(provenance['path']).resolve())
    analysis.expect(not any(output.is_relative_to(path) for path in protected), 'Report cannot alter source/preparation/acquisition/analysis inputs')
    report_assets = preparation.get('reportAssets')
    analysis.expect(report_assets, 'Missing separately packed en-table registration assets; unregistered decoration is not a report')
    asset_receipt_path = analysis.within(prepared, report_assets['receipt'])
    asset_receipt = read_bound(asset_receipt_path, report_assets['receiptSha256'])
    analysis.expect(report_assets['specifier'] == '@en-reve/elements/define/table.js', 'Report asset must explicitly register en-table')
    analysis.expect(report_assets['assets'] == asset_receipt['assets'], 'Report asset list differs')
    asset_root = (analysis.within(prepared, report_assets['root']) / 'site').resolve()
    analysis.expect(asset_root.is_relative_to(prepared), 'Report asset root escapes preparation')
    analysis.verify_inventory(asset_root, asset_receipt['assets'], exact=True)
    analysis.expect(report_assets['entry'] in {asset['path'] for asset in asset_receipt['assets']}, 'Report entry is not sealed')
    evidence = output / 'evidence'
    copies = [(source / 'analysis.json', output / 'analysis.json'),
              (source / 'analysis-receipt.json', output / 'analysis-receipt.json'),
              (prepared / 'manifest.json', evidence / 'prepared-manifest.json'),
              (asset_receipt_path, evidence / 'report-assets-receipt.json')]
    for arm in preparation['arms']:
        original = analysis.within(prepared, arm['receipt'])
        bind(original, arm['receiptSha256'])
        copies.append((original, analysis.within(evidence / 'prepared', arm['receipt'])))
    for subjects in preparation.get('selectiveEntries', {}).values():
        for entries in subjects.values():
            for entry in entries.values():
                original = analysis.within(prepared, entry['receipt'])
                bind(original, entry['receiptSha256'])
                copies.append((original, analysis.within(evidence / 'prepared', entry['receipt'])))
    raw_links = []
    for kind in ('timing', 'retention', 'ssr'):
        provenance = data['provenance'].get(kind)
        if not provenance:
            continue
        run = Path(provenance['path']).resolve()
        for name, key in [('manifest.json', 'manifestSha256'), ('summary.json', 'summarySha256'), ('samples.jsonl', 'rawSha256')]:
            expected = provenance.get('files', {}).get(name, provenance.get(key))
            bind(run / name, expected)
            copies.append((run / name, evidence / kind / name))
            raw_links.append(f'<a href="evidence/{kind}/{name}">{kind} {name}</a>')
    for original, expected in bound_inputs.items():
        analysis.expect(analysis.file_digest(original) == expected, 'Input changed before report copy')
    output.mkdir()
    shutil.copytree(asset_root, output / 'report-assets')
    analysis.verify_inventory(output / 'report-assets', asset_receipt['assets'], exact=True)
    copied_evidence = []
    for original, target in copies:
        expected = bound_inputs[original.resolve()]
        target.parent.mkdir(parents=True, exist_ok=True)
        with original.open('rb') as reader, target.open('xb') as writer:
            shutil.copyfileobj(reader, writer)
        analysis.expect(analysis.file_digest(original) == expected and analysis.file_digest(target) == expected, 'Evidence changed during report copy')
        copied_evidence.append({'source': str(original), 'copy': target.relative_to(output).as_posix(), 'sha256': expected})
    labels = {'media': 'Media', 'combobox': 'Selection', 'command': 'Commands', 'pagination': 'Pagination'}
    navigation = ''.join('<a href="#' + escape(family) + '-decision">' + escape(labels[family]) + '</a>' for family in data['families'])
    content = '<header><p class="eyebrow">En Rêve · construction on demand</p><h1>Actual route family evidence</h1><p class="lede">The declared families keep independent decisions. Same-code construction saves no optional module or registration traffic.</p><nav>' + navigation + '<a href="#provenance">Raw evidence</a></nav></header>'
    content += '<p class="notice">' + escape(data['rolloutAcceptance']) + '</p>'
    total_required = sum(result['matrix']['required'] for result in data['families'].values())
    total_successful = sum(result['matrix']['successful'] for result in data['families'].values())
    content += '<p>Required family timing and preparation observations: <strong>' + display(total_successful) + ' / ' + display(total_required) + '</strong>. This denominator covers only the declared analysis families: ' + escape(', '.join(labels[family] for family in data['families'])) + '. Retention and Selection server rendering are separate acquisitions; no omitted family is qualified.</p>'
    columns = [('comparison', 'Comparison', False), ('deliveryPolicy', 'Code delivery policy', False), ('browser', 'Engine', False), ('profile', 'Profile', False), ('action', 'Input', False), ('actualRegistry', 'Actual registry', False), ('metric', 'Metric', False), ('n', 'Paired n / arm', True), ('referenceMedian', 'Before median', True), ('candidateMedian', 'After median', True), ('medianDelta', 'Median Δ', True), ('medianPercent', 'Median change %', True), ('medianLow', '95% median Δ low', True), ('medianHigh', '95% median Δ high', True), ('referenceP75', 'Before p75', True), ('candidateP75', 'After p75', True), ('candidateP75Upper', 'One-sided 95% p75 upper', True), ('p75Delta', 'p75 Δ', True), ('p75Percent', 'p75 change %', True), ('p75Low', '95% p75 Δ low', True), ('p75High', '95% p75 Δ high', True), ('referenceP95', 'Before p95 n≥100', True), ('candidateP95', 'After p95 n≥100', True), ('referenceSpread', 'Before min…max', False), ('candidateSpread', 'After min…max', False)]
    for family, result in data['families'].items():
        title = {'media': 'Media · two original images', 'combobox': 'Selection · 40 original projects',
                 'command': 'Commands · original Settings workload', 'pagination': 'Pagination · original paginator specimens'}.get(family, family)
        decision = result['decision']
        content += (f'<section id="{family}-decision"><h2>{escape(title)}</h2><p class="decision">Automated evidence: <strong>{escape(decision["automatedStatus"])}</strong> · human review: <strong>{escape(decision["humanReview"])}</strong></p>'
                    f'<p>{escape(decision["scope"])}. {escape(decision["conclusion"])}</p><p>Complete required matrix: {escape(result["matrix"]["complete"])}. Successful observations: {display(result["matrix"]["successful"])} / {display(result["matrix"]["required"])} planned.</p>'
                    '<dl class="categories">' + ''.join(f'<div><dt>{escape(key)}</dt><dd>{escape(value)}</dd></div>' for key, value in decision['categories'].items()) + '</dl>'
                    '<details><summary>Coverage and integrity diagnostics</summary><pre>' + escape(json.dumps(result['matrix'], indent=2)) + '</pre></details></section>')
        if result.get('controls'):
            content += table(family + '-controls', title + ' · unchanged control specimens', result['controls'],
                             [('id', 'Control', False), ('status', 'Disposition', False), ('reason', 'Source / evidence boundary', False)],
                             [('Scope', 'Controls retain their original authored policy and workload. Source opportunity and prior observations do not replace current matched campaign evidence.')])
        content += table(family + '-timing', title + ' · paired timing, DOM and traffic', comparison_rows(result['rows']), columns, DELTA_NOTES)
        if 'preparationObservations' in result and family == 'command':
            observations, operations = preparation_rows(result['preparationObservations'])
            content += table(family + '-preparation', title + ' · every preparation and traffic observation', observations,
                             [('deliveryPolicy', 'Code delivery policy', False), ('browser', 'Engine', False), ('profile', 'Profile', False),
                              ('action', 'Input', False), ('arm', 'Arm', False), ('block', 'Matched block', True), ('valid', 'Valid evidence', False),
                              ('actualLeadMs', 'Actual preparation lead ms', True), ('preparationPendingAtActivation', 'Pending at activation', False),
                              ('inputApplicability', 'Input applicability', False), ('publicLoadMs', 'Public load ms', True), ('publicEnsureMs', 'Public ensure ms', True),
                              ('preparationStartedAt', 'Controlled preparation start ms', True), ('preparationCompletedAt', 'Controlled preparation completion ms', True),
                              ('preparationStatus', 'Controlled preparation status', False), ('loadCompletedAt', 'Load completion ms', True), ('ensureCompletedAt', 'Ensure completion ms', True),
                              ('before-settledGzipBytes', 'Before delivered gzip bytes', True), ('before-settledRequests', 'Before requests', True),
                              ('before-encodedBodyBytes', 'Before encoded body bytes', True), ('before-transferBytes', 'Before transfer bytes', True),
                              ('completion-settledGzipBytes', 'Completion snapshot gzip bytes', True), ('completion-settledRequests', 'Completion snapshot requests', True),
                              ('completion-encodedBodyBytes', 'Completion snapshot encoded body bytes', True), ('completion-transferBytes', 'Completion snapshot transfer bytes', True),
                              ('final-settledGzipBytes', 'Final delivered gzip bytes', True), ('final-settledRequests', 'Final requests', True),
                              ('final-encodedBodyBytes', 'Final encoded body bytes', True), ('final-transferBytes', 'Final transfer bytes', True),
                              ('completionAddedGzipBytes', 'Completion − before gzip Δ', True), ('completionAddedRequests', 'Completion − before request Δ', True),
                              ('finalAddedGzipBytes', 'Final − before gzip Δ', True), ('finalAddedRequests', 'Final − before request Δ', True),
                              ('problems', 'Evidence problems', False)],
                             [('Scope', 'Each row is one original policy/configuration/arm/block observation. Cold, same-code, prepared-0, prepared-50, prepared-200 and never-used evidence remain separate. Controlled route-entry suppression is not actual-route benefit.'),
                              ('Time and completion', 'Lead and public method durations are milliseconds. Start/completion timestamps use that document’s performance clock and cannot be compared as wall-clock time across rows. Actual lead and pending-at-activation state are observed, never replaced by the requested lead. Cold has no explicit controlled preparation; never-used has no input or ensure operation.'),
                              ('Traffic phases', 'Before, completion snapshot and final settled traffic are cumulative observed executable-resource closures, with frozen gzip sizes and observed request counts. The active-policy completion snapshot follows first and repeat use; it is not traffic sampled at the individual load-completion timestamp. Unused rows wait for load settlement. Final traffic is captured another 500 ms later. Encoded body and transfer bytes are separate browser metrics. Startup entry totals cannot substitute for completion or final traffic.'),
                              ('Delta direction', 'The displayed traffic Δ is completion/final minus before within this observation. Positive means additional delivered bytes or requests; negative means less. Expected loading within a context is distinct from a regression: the gate table compares candidate minus matched comparator at the same policy and phase.'),
                              ('Unavailable evidence', '— means missing or structurally inapplicable, never zero. The explicit policy, applicability, validity and problems columns distinguish those cases. All original operations and raw JSONL receipts remain available below.')])
            content += table(family + '-operations', title + ' · original public operation receipts', operations,
                             [('deliveryPolicy', 'Code delivery policy', False), ('browser', 'Engine', False), ('profile', 'Profile', False),
                              ('action', 'Input', False), ('arm', 'Arm', False), ('block', 'Matched block', True), ('valid', 'Valid observation', False),
                              ('operationId', 'Original operation ID', True), ('operationKind', 'Public operation', False), ('operationStatus', 'Completion status', False),
                              ('operationStartedAt', 'Started at ms', True), ('operationCompletedAt', 'Completed at ms', True), ('operationDurationMs', 'Duration ms', True),
                              ('registrationBefore', 'Registration before', False), ('registrationAfter', 'Registration after', False),
                              ('focusUnchanged', 'Focus unchanged', False), ('operationError', 'Operation error', False)],
                             [('Identity and time', 'Operation IDs belong to their original policy/configuration/arm/block observation. Timestamps are milliseconds on that document’s performance clock; duration is completion minus start. The table preserves every captured public operation, including intent or repeated operations.'),
                              ('Completion and ownership', 'Load and ensure have different registration effects. Completed loading alone cannot stand in for registered definitions or a usable first interaction. Registration maps, focus preservation and errors remain explicit; missing values do not establish success.')])
        retention_notes = [('Comparator', 'Each Δ is cycle 100 minus cycle 10 in this exact fresh-context repetition; negative means lower retained cost. Every repetition and both lifecycle types remain visible.'),
                           ('Collection and scope', '300 ms settling and two explicit collections. Connected nodes, reported detached nodes, detached hosts/inputs and listeners are separate counts. Heap is bytes; heap % divides by cycle-10 heap. Intentional post-first-use generated DOM is shown separately.'),
                           ('Limit', 'Five fresh contexts do not establish absence of leaks. Unsupported detached diagnostics are —, never zero. No repeated-cycle growth is excused by bounded first-use retention.')]
        content += table(family + '-retention', title + ' · every retention repetition', result['retention'],
                         [('arm', 'Arm', False), ('lifecycle', 'Lifecycle', False), ('block', 'Repetition', True), ('valid', 'Valid observation', False), ('heapBefore', 'Heap at 10', True), ('heapAfter', 'Heap at 100', True), ('heapDelta', 'Heap Δ bytes', True), ('heapPercent', 'Heap Δ %', True), ('candidateHeapBaseline', 'Matched candidate heap baseline', True), ('heapMaximum', 'Applicable heap-growth ceiling', True), ('connectedDelta', 'Connected Δ', True), ('detachedDelta', 'Detached nodes Δ', True), ('detachedHostsDelta', 'Detached hosts Δ', True), ('detachedHostsAtZero', 'Detached hosts at 0', True), ('detachedHostsFromZero', 'Detached hosts 100 − 0 Δ', True), ('detachedInputsDelta', 'Detached inputs Δ', True), ('listenersDelta', 'Listeners Δ', True), ('generatedBefore', 'Generated nodes at 10', True), ('generatedAfter', 'Generated nodes at 100', True), ('detachedUnsupported', 'Unsupported diagnostics', False)], retention_notes + [('Command retention', 'Command heap growth uses the recorded matched candidate cycle-10 baseline and its frozen max(64 KiB, 1%) ceiling. Disposed-host rows also show cycle 100 minus cycle 0 detached-host growth so a first removed host cannot disappear into the cycle-10 baseline. The matched candidate heap baseline and ceiling fields are command-specific.')])
        retention_comparisons = [dict(row, referenceMedian=row['reference']['median'], candidateMedian=row['candidate']['median'], low=(row['uncertainty']['delta'] or [None, None])[0], high=(row['uncertainty']['delta'] or [None, None])[1]) for row in result['retentionComparisons']]
        content += table(family + '-retention-comparisons', title + ' · paired heap growth', retention_comparisons,
                         [('comparison', 'Comparison', False), ('lifecycle', 'Lifecycle', False), ('n', 'Paired contexts', True), ('referenceMedian', 'Before median growth', True), ('candidateMedian', 'After median growth', True), ('medianDelta', 'Growth Δ bytes', True), ('low', '95% Δ lower', True), ('high', '95% Δ upper', True)], DELTA_NOTES + [('Retention statistic', 'These are paired medians of each context’s heap growth from cycle 10 to 100, separate from timing samples. Selection’s candidate−reference ceiling is 1 MiB with uncertainty; candidate−rollback remains separately visible.')])
        assets = [dict(row, referenceGzip=analysis.get(row, 'reference.gzipBytes'), candidateGzip=analysis.get(row, 'candidate.gzipBytes'), referenceRequests=analysis.get(row, 'reference.requests'), candidateRequests=analysis.get(row, 'candidate.requests')) for row in result['assets']]
        content += table(family + '-packaging', title + ' · separately packed public entries', assets,
                         [('kind', 'Public entry', False), ('referenceGzip', 'Reference gzip bytes', True), ('candidateGzip', 'Candidate gzip bytes', True), ('gzipDelta', 'Gzip Δ bytes', True), ('referenceRequests', 'Reference requests', True), ('candidateRequests', 'Candidate requests', True), ('requestDelta', 'Request Δ', True), ('reason', 'Missing / invalid evidence', False)],
                         [('Comparator', 'Every Δ is candidate minus reference. Negative bytes/requests are smaller; positive adds cost.'), ('Boundary', 'Class and definition entries are built separately from packed packages with sealed static closures. Actual-route entry totals and browser transferred bytes cannot substitute. Report assets are excluded from measured routes.'), ('Uncertainty', 'These byte/request counts are deterministic frozen artifacts, not sampled timings. Missing receipts or hashes remain pending.')])
        if family == 'combobox':
            server = [dict(row, referenceP75=row['reference']['p75'], candidateP75=row['candidate']['p75'], low=(row['uncertainty']['delta'] or [None, None])[0], high=(row['uncertainty']['delta'] or [None, None])[1]) for row in result['server']]
            content += table(family + '-server', 'Selection · separate production SSR render boundary', server,
                             [('comparison', 'Comparison', False), ('n', 'Fresh process n / arm', True), ('referenceP75', 'Before render p75 ms', True), ('candidateP75', 'After render p75 ms', True), ('p75Delta', 'Render p75 Δ ms', True), ('p75Percent', 'Render p75 Δ %', True), ('low', '95% Δ lower', True), ('high', '95% Δ upper', True)],
                             DELTA_NOTES + [('Server boundary', 'Fresh-process renderWorkflows(selection), with module import and process boot reported separately in the original receipt. Static HTTP serving, browser startup and docs build wall time are not SSR render measurements.')])
        gate_rows = [dict(row, low=(row.get('interval') or [None, None])[0], high=(row.get('interval') or [None, None])[1]) for row in result['checks']]
        content += table(family + '-gates', title + ' · every frozen gate', gate_rows,
                         [('category', 'Category', False), ('id', 'Exact gate / cell', False), ('status', 'Decision', False), ('n', 'n', True), ('value', 'Observed', True), ('minimum', 'Minimum', True), ('maximum', 'Maximum', True), ('low', '95% lower', True), ('high', '95% upper', True), ('reason', 'Evidence / limitation', False)],
                         [('Direction', 'Signed cost changes are lower-is-better. Reduction minima are expressed as negative cost-change ceilings; coverage counts use explicit minima. Read the named metric and bound, not color alone.'), ('Decision', 'A passed point with an interval beyond its ceiling is uncertain. Missing metrics, cells, selective-entry receipts, server evidence or human acceptance never become zero/pass.'), ('Protocol', 'Every frozen numeric family gate remains in force. Failures require preserved evidence and a declared new candidate/campaign, not relaxed thresholds or favorable replacement cells.')])
    content += '<section id="provenance"><h2>Raw observations and provenance</h2><p>' + ' · '.join(raw_links) + ' · <a href="analysis.json">All analysis and gate calculations</a> · <a href="evidence/prepared-manifest.json">Exact prepared sources, builds and harness</a> · <a href="evidence/report-assets-receipt.json">Packed en-table registration receipt</a></p><p>Prepared manifest SHA256: <code>' + escape(data['preparedManifestSha256']) + '</code>. Frozen family budget SHA256: <code>' + escape(data['frozenBudgetSha256']) + '</code>.</p><p>Original prepared root: <code>' + escape(data['prepared']) + '</code>.</p><ul>' + ''.join('<li>' + escape(note) + '</li>' for note in data['limits']) + '</ul><details><summary>Analysis provenance and uncertainty</summary><pre>' + escape(json.dumps({'provenance': data['provenance'], 'uncertainty': data['uncertainty']}, indent=2)) + '</pre></details><p>User review state belongs to the project’s independent Progress Report. This evidence report does not mark any result reviewed.</p></section>'
    css = 'html{color-scheme:light}body{margin:0;background:#f3f6f0;color:#19372b;font:15px/1.55 system-ui}main{max-width:1800px;margin:auto;padding:32px 24px}header{padding:28px;background:#e1eddf;border-radius:14px}h1{font-size:clamp(30px,4vw,48px);line-height:1.12;margin:.35em 0}h2{font-size:22px}nav{display:flex;gap:20px;flex-wrap:wrap}a{color:#165840}.eyebrow{letter-spacing:.13em;text-transform:uppercase;font-size:12px}.lede{font-size:19px;max-width:85ch}section{margin:28px 0;padding:22px;background:white;border:1px solid #dbe5d8;border-radius:12px}.notice{border-left:4px solid #55785b;padding:16px}.filter{display:block;margin:14px 0}input{font:inherit;padding:7px;border:1px solid #94ad9b;border-radius:4px;width:min(100%,320px);box-sizing:border-box}en-table{display:block;overflow-x:auto}table{border-collapse:collapse;min-width:100%;font-size:13px}caption{text-align:left;font-weight:600;margin-bottom:10px}th,td{padding:9px;text-align:left;vertical-align:top;border-bottom:1px solid #e0e8dd}th{background:#edf3e9;white-space:nowrap}th button{font:inherit;font-weight:600;color:inherit;border:0;background:transparent;text-align:left;cursor:pointer}th[aria-sort=ascending] button:after{content:" ↑"}th[aria-sort=descending] button:after{content:" ↓"}td{font-variant-numeric:tabular-nums}tr[hidden]{display:none}.notes{font-size:13px;background:#f0f5ec;padding:14px;border-left:3px solid #507f61}.notes div{margin:6px 0}.notes dt{font-weight:650}.notes dd{margin:0;max-width:150ch}.categories{display:flex;gap:24px;flex-wrap:wrap}.categories dt{font-size:12px;text-transform:uppercase}.categories dd{margin:0;font-weight:650}pre{overflow:auto;font-size:12px}code{overflow-wrap:anywhere}.decision{font-size:18px}'
    script = '''await customElements.whenDefined('en-table');
for (const section of document.querySelectorAll('[data-table]')) {
  const table = section.querySelector('table'), body = table.tBodies[0], status = section.querySelector('[role=status]');
  const rows = [...body.rows];
  section.querySelector('input').addEventListener('input', event => {
    const term = event.target.value.toLocaleLowerCase();
    for (const row of rows) row.hidden = !row.textContent.toLocaleLowerCase().includes(term);
    status.textContent = rows.filter(row => !row.hidden).length + ' of ' + rows.length + ' rows';
  });
  for (const button of section.querySelectorAll('th button')) {
    button.disabled = false;
    button.addEventListener('click', () => {
      const heading = button.closest('th'), ascending = heading.getAttribute('aria-sort') !== 'ascending';
      for (const cell of table.tHead.rows[0].cells) cell.removeAttribute('aria-sort');
      heading.setAttribute('aria-sort', ascending ? 'ascending' : 'descending');
      const index = Number(button.dataset.index), numeric = button.dataset.type === 'number';
      rows.sort((a, b) => {
        const x = a.cells[index].dataset.value, y = b.cells[index].dataset.value;
        if (x === '' || y === '') return x === y ? Number(a.dataset.order) - Number(b.dataset.order) : x === '' ? 1 : -1;
        const order = numeric ? Number(x) - Number(y) : x.localeCompare(y);
        return order ? (ascending ? order : -order) : Number(a.dataset.order) - Number(b.dataset.order);
      });
      for (const row of rows) body.append(row);
      status.textContent = 'Sorted by ' + button.textContent + ', ' + (ascending ? 'ascending' : 'descending');
    });
  }
}'''
    document = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>En Rêve · Actual route family evidence</title><style>' + css + '</style></head><body><main>' + content + '</main><script type="module" src="./report-assets/' + escape(report_assets['entry']) + '"></script><script type="module">' + script + '</script></body></html>'
    with (output / 'index.html').open('x') as stream:
        stream.write(document)
    analysis.expect(analysis.file_digest(output / 'index.html') == analysis.digest(document), 'Report readback changed')
    for original, expected in bound_inputs.items():
        analysis.expect(analysis.file_digest(original) == expected, 'Input changed during presentation')
    analysis.verify_inventory(asset_root, asset_receipt['assets'], exact=True)
    analysis.verify_inventory(output / 'report-assets', asset_receipt['assets'], exact=True)
    for item in copied_evidence:
        analysis.expect(analysis.file_digest(output / item['copy']) == item['sha256'], 'Copied evidence changed during presentation')
    with (output / 'report-receipt.json').open('x') as stream:
        stream.write(json.dumps({'reportSha256': analysis.file_digest(output / 'index.html'), 'analysisSha256': receipt['analysisSha256'], 'preparedManifestSha256': data['preparedManifestSha256'], 'reportAssetsReceiptSha256': report_assets['receiptSha256'], 'reporterSha256': analysis.file_digest(__file__), 'evidence': copied_evidence}, indent=2) + '\n')
    print(output / 'index.html')


if __name__ == '__main__':
    main()
