"""Output-only HTML presentation for current editor, color, and census evidence.

This module computes no statistics, thresholds, decisions, or acceptance state.
It requires an existing packed en-table receipt. It never builds or acquires.
"""
from pathlib import Path
import argparse
import hashlib
import html
import json
import re
import shutil


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def read(path):
    return json.loads(Path(path).read_text())


def bound_fields(value):
    return {'authoritativeUpper95': get(value, 'upper95.value'),
            'achievedCoverageLowerBound': get(value, 'upper95.achievedCoverageLowerBound'),
            'leftUpperRank': get(value, 'upper95.leftUpper.rank'),
            'rightLowerRank': get(value, 'upper95.rightLower.rank'),
            'descriptiveBootstrapLow': (value.get('approximateBootstrapCi95') or [None, None])[0],
            'descriptiveBootstrapHigh': (value.get('approximateBootstrapCi95') or [None, None])[1]}


def inside(root, name):
    path = (root / name).resolve()
    if not path.is_relative_to(root.resolve()) or path == root.resolve():
        raise ValueError('Path escapes its declared root: ' + str(name))
    return path


def assignments(values):
    result = {}
    for value in values:
        name, separator, path = value.partition('=')
        if not separator or not re.fullmatch('[a-z][a-z0-9-]*', name) or name in result:
            raise ValueError('Use unique lowercase name=/absolute/path inputs')
        result[name] = Path(path).resolve(strict=True)
    return result


def get(value, path, default=None):
    for key in path.split('.'):
        if not isinstance(value, dict) or key not in value:
            return default
        value = value[key]
    return value


def display(value):
    if value is None:
        return '—'
    if isinstance(value, (dict, list)):
        value = json.dumps(value, ensure_ascii=False, allow_nan=False)
    elif isinstance(value, bool):
        value = 'true' if value else 'false'
    return html.escape(str(value), quote=True)


def unpack(prefix, values):
    return {prefix + key: value for key, value in (values or {}).items()}


COST_NOTE = ('Better sign: each explicitly named candidate-minus-reference, candidate-minus-rollback, '
             'or rollback-minus-reference delta is a cost change. Smaller/negative latency, bytes, '
             'requests and retained counts are better; positive adds cost. Missing values are —, never zero. '
             'All statistics and decisions are copied from the named input; this presenter recalculates none.')
SAVING_NOTE = ('Better sign: positive removed-node counts, reduction percentages and reference-minus-candidate '
               'byte savings indicate more saving. Census bounds are potential reference allocation, not '
               'achieved candidate changes. All-node counts include text/comment nodes and open shadow trees; '
               'elements are a separate unit. Missing values are —, never zero.')
RETENTION_NOTE = ('Better sign: growth is cycle 100 minus cycle 10 in the same original repetition; '
                 'smaller/negative connected-node, retained DOM, listener and heap changes are better. '
                 'Heap comparison uses candidate median growth minus the named eager arm median growth; '
                 'the median of paired differences is separate supporting evidence. Unsupported counters '
                 'remain unsupported/—. Five contexts do not establish absence of leaks.')


def table(identifier, title, rows, note, columns=None):
    rows = list(rows)
    if columns is None:
        columns = list(dict.fromkeys(key for row in rows for key in row))
    if not columns:
        columns = ['evidence']
    headers = []
    for index, key in enumerate(columns):
        values = [row.get(key) for row in rows if row.get(key) is not None]
        numeric = bool(values) and all(type(value) in (int, float) for value in values)
        headers.append(f'<th scope="col"><button disabled data-index="{index}" data-type="{"number" if numeric else "text"}">{display(key)}</button></th>')
    body = []
    for index, row in enumerate(rows):
        cells = []
        for key in columns:
            value = row.get(key)
            cells.append(f'<td data-value="{display(value) if value is not None else ""}">{display(value)}</td>')
        body.append(f'<tr data-order="{index}">' + ''.join(cells) + '</tr>')
    empty = '<p>No observations supplied for this table. No zero, pass, or completion is inferred.</p>' if not rows else ''
    return (f'<section id="{identifier}" data-comparison><h2>{display(title)}</h2>{empty}'
            '<label>Filter rows <input type="search"></label>'
            f'<en-table label="{display(title)}"><table aria-describedby="{identifier}-direction"><caption>{display(title)}</caption>'
            '<thead><tr>' + ''.join(headers) + '</tr></thead><tbody>' + ''.join(body) + '</tbody></table></en-table>'
            f'<p id="{identifier}-direction" class="direction">{display(note)}</p><p role="status" aria-live="polite">{len(rows)} rows</p></section>')


def details(title, value):
    return f'<details><summary>{display(title)}</summary><pre>{display(json.dumps(value, indent=2, ensure_ascii=False, allow_nan=False))}</pre></details>'


def editor(data):
    analysis = data['analysis']
    content = details('Timing status, counts, validation and scope — source values', {
        key: analysis.get(key) for key in ('subject', 'route', 'scope', 'counts', 'validation', 'empiricalPass',
                                         'uncertaintyQualified', 'qualifiedForMeasuredGates', 'limits', 'methodology')})
    absolute, comparisons, deterministic, benefits, gates, cells, absolute_bounds = [], [], [], [], [], [], []
    for cell in analysis.get('cells', []):
        context = {key: cell.get(key) for key in ('browser', 'profile', 'requestedRegistry', 'actualRegistry')}
        cells.append({**context, **{key: cell.get(key) for key in ('counts', 'empiricalPass', 'uncertaintyQualified', 'matchedSuccessfulBlocks')}})
        for arm, metrics in (cell.get('absolute') or {}).items():
            for metric, values in (metrics or {}).items():
                absolute.append({**context, 'arm': arm, 'metric': metric, **values})
        for metric, result in (cell.get('timing') or {}).items():
            for arm, values in (result.get('absolute') or {}).items():
                absolute_bounds.append({**context, 'metric': metric, 'arm': arm, 'n': result.get('n'), 'p95': values.get('p95'),
                                        'authoritativeUpper95': get(values, 'upper95.value'), 'rank': get(values, 'upper95.rank'),
                                        'achievedCoverage': get(values, 'upper95.achievedCoverage')})
            for comparison, values in (result.get('changes') or {}).items():
                comparisons.append({**context, 'metric': metric, 'comparison': comparison, 'n': result.get('n'),
                                    'difference': values.get('difference'), 'percent': values.get('percent'), **bound_fields(values)})
        for metric, results in (cell.get('deterministicChanges') or {}).items():
            for comparison, values in results.items():
                deterministic.append({**context, 'metric': metric, 'comparison': comparison, **values})
        benefits.extend({**context, **row} for row in cell.get('nodeBenefits', []))
        gates.extend({**context, **row} for row in cell.get('gates', []))
    content += table('editor-cells', 'Editor original cell coverage and decisions', cells,
                     'Better sign: categorical original states have no numeric delta. Complete matched blocks and both empirical/confidence decisions remain separate; null is unavailable, never pass.')
    content += table('editor-absolute', 'Editor descriptive arm statistics', absolute,
                     COST_NOTE + ' These are descriptive original distributions, including incomplete campaigns; p95 is supplied only where the analyzer permits it.')
    content += table('editor-timing', 'Editor named timing comparisons', comparisons,
                     COST_NOTE + ' The upper95 binomial/Bonferroni bound is authoritative. approximateBootstrapCi95 is descriptive and cannot authorize acceptance. Invalid campaigns may have no comparison rows.')
    content += table('editor-absolute-bounds', 'Editor original absolute p95 confidence bounds', absolute_bounds,
                     COST_NOTE + ' authoritativeUpper95 is the original one-sided binomial bound; rank and achievedCoverage are copied, not recomputed.')
    content += table('editor-delivery', 'Editor deterministic delivery and node changes', deterministic,
                     COST_NOTE + ' Gzip values are emitted JavaScript receipt bytes, not transfer bytes or HTML/CSS. No resource-identity equivalence is inferred from equal request counts.')
    content += table('editor-benefit', 'Editor node benefit by original block', benefits, SAVING_NOTE)
    content += table('editor-gates', 'Editor gates as emitted by the analyzer', gates,
                     COST_NOTE + ' operator/limit and empiricalPass/uncertaintyQualified are authoritative input fields; null remains unavailable. Removal/reduction gates prefer larger positive savings.')
    content += details('Editor retained failures and original journal', {'failures': analysis.get('failures'), 'journal': analysis.get('journal')})
    retention = data.get('retention')
    repetitions, checkpoints, heap, pairs = [], [], [], []
    if retention:
        content += details('Separate retention status and applicability — source values', {key: retention.get(key) for key in
                           ('kind', 'status', 'selectedMatrix', 'completedRepetitions', 'protocol', 'promotionDecision', 'preflightErrors', 'verificationErrors', 'error', 'verification', 'listenerAndHeapCoverage', 'preparationUnchanged', 'harnessUnchanged', 'runtimeUnchanged', 'preparation')})
        for row in retention.get('rows', []):
            context = {key: row.get(key) for key in ('id', 'engine', 'viewport', 'repetition', 'arm', 'version', 'status', 'completedCycles')}
            repetitions.append({**context, **(row.get('growth') or {}), 'pageErrors': row.get('pageErrors'), 'requestFailures': row.get('requestFailures'), 'error': row.get('error')})
            for point in row.get('checkpoints', []):
                checkpoints.append({**context, 'cycle': point.get('cycle'), **unpack('connected.', point.get('connected')),
                                    'memory.status': get(point, 'memory.status'), 'memory.reason': get(point, 'memory.reason'),
                                    **unpack('dom.', get(point, 'memory.dom')), **unpack('heap.', get(point, 'memory.heap'))})
        for row in retention.get('heapComparisons', []):
            heap.append({key: value for key, value in row.items() if key != 'pairs'})
            pairs.extend({**{key: row.get(key) for key in ('engine', 'viewport', 'eager')}, **pair} for pair in row.get('pairs', []))
        content += details('Every planned retention job — includes unstarted jobs', retention.get('planned'))
    else:
        content += '<p class="notice">Retention input was not supplied. No retention measurement or qualification is inferred.</p>'
    content += table('editor-retention', 'Separate retention — every observed repetition', repetitions, RETENTION_NOTE)
    content += table('editor-checkpoints', 'Separate retention — raw checkpoints', checkpoints,
                     'Better sign: these are original absolute checkpoint counters, not deltas. Lower counts do not alone prove bounded growth. Unsupported memory counters are unavailable, never zero.')
    content += table('editor-heap', 'Separate retention — analyzer heap comparisons', heap, RETENTION_NOTE)
    content += table('editor-heap-pairs', 'Separate retention — original paired growth', pairs, RETENTION_NOTE)
    scenario = data.get('scenario')
    if scenario:
        content += details('Descriptive scenario method, validity and assumptions', {key: value for key, value in scenario.items() if key not in ('arms', 'comparisons', 'blocks')})
        content += table('editor-usage-arms', 'Editor descriptive scenario cost index — sample means', scenario.get('arms', []),
                         'Better sign: a smaller meanIndexMs is a lower scenario readiness-cost index. usage is a fraction: 0, .25, .5 or 1; .25 is the declared assumption, not telemetry. This is not page duration, INP or observed session time. No new uncertainty or gate applies.')
        content += table('editor-usage', 'Editor descriptive scenario cost index — same-block mean changes', scenario.get('comparisons', []),
                         COST_NOTE + ' Mean paired deltas apply to J(u)=startupMs+u*firstSelectionMs only. They exclude setup/dwell/observation waits, separate-page focus and repeat use. They cannot rescue any original failed or uncertain gate.')
    else:
        content += table('editor-usage', 'Usage assumptions — no measured scenario calculation supplied',
                         [{'usagePercent': value, 'basis': 'Frozen assumption, not telemetry', 'scenarioIndex': 'Unavailable; no value inferred'} for value in (0, 25, 50, 100)],
                         'Better sign: no scenario delta is available. Deterministic rejection or incomplete timing produces no index; if timing completed, supply its separately hash-bound editor-scenario output. Do not combine medians or p95s into an invented expected value.')
    return content


def color_full(analysis):
    """Only flatten original analyzer fields; never recalculate or accept."""
    content = details('Full color campaign — original analysis and qualification scope',
                      {key: analysis.get(key) for key in ('status', 'validationErrors', 'qualifiedForMeasuredGates',
                       'rolloutAcceptance', 'acquisitionStatuses', 'uncertainty', 'provenance')})
    static = analysis.get('static') or {}
    content += table('color-full-static', 'Full color production startup attribution',
                     [{'arm': arm, **static.get(arm, {})} for arm in ('reference', 'candidate')],
                     COST_NOTE + ' This is the original uninstrumented production route. Same-code bridge assets are a separate control and never count toward byte saving.')
    content += table('color-full-static-gates', 'Full color original deterministic byte gates', static.get('gates', []), SAVING_NOTE)
    timing = analysis.get('timing') or {}
    absolute, changes, cells = [], [], []
    for cell in timing.get('cells', []):
        context = {key: cell.get(key) for key in ('browser', 'profile', 'sourceKind', 'policy', 'input')}
        cells.append({**context, **{key: cell.get(key) for key in ('plannedPairs', 'completePairs', 'complete', 'actualRegistries')}})
        for metric, value in cell.get('metrics', {}).items():
            for arm in ('reference', 'candidate'):
                absolute.append({**context, 'metric': metric, 'arm': arm, **(value.get(arm) or {})})
            changes.append({**context, 'metric': metric, 'referenceMetric': value.get('referenceMetric', metric),
                            **{key: value.get(key) for key in ('n', 'differenceOfMedians', 'upper95', 'pairedBootstrap95',
                                                            'fractionOfReferenceMedian', 'fractionUpper95')}})
    content += table('color-full-cells', 'Full color exact cells and registry ownership', cells,
                     'Better sign: completePairs is coverage, not performance. Actual observed native registry ownership is copied; unsupported/unmeasured states never imply a global fallback or a pass.')
    content += table('color-full-absolute', 'Full color original arm distributions', absolute,
                     COST_NOTE + ' n, median, p75 and range are descriptive. p95 is absent below100; no pooled or replacement samples are introduced.')
    content += table('color-full-changes', 'Full color matched changes and paired uncertainty', changes,
                     COST_NOTE + ' differenceOfMedians is candidate minus reference. Negative startup gzip/fraction is saving; a -4096 byte / -.10 fraction ceiling means at least4096 bytes /10% saving. upper95 is copied from the original paired bootstrap.')
    content += table('color-full-gates', 'Full color original measured gates', timing.get('gates', []),
                     COST_NOTE + ' Point and upper95 must both satisfy their original limit and complete must be true. Static and observed savings, production timing, and controlled construction remain separate decisions.')
    preparation, traffic = [], []
    for row in timing.get('preparationAndTraffic', []):
        context = {key: row.get(key) for key in ('id', 'block', 'sourceKind', 'arm', 'policy', 'input', 'browser', 'profile', 'status')}
        prep = row.get('preparation') or {}
        preparation.append({**context, **{key: prep.get(key) for key in ('applicable', 'requestedLeadMs', 'actualLeadMs', 'verified', 'preparationPendingAtActivation')},
                            'result': prep.get('result')})
        for phase, snapshot in (row.get('snapshots') or {}).items():
            counters = snapshot.get('traffic') or {}
            traffic.append({**context, 'phase': phase, **{key: counters.get(key) for key in
                            ('rawBytes', 'gzipBytes', 'encodedBodyBytes', 'decodedBodyBytes', 'transferBytes', 'requests', 'uniqueRequests')}})
    content += table('color-full-preparation', 'Full color preparation, immediate use and abandonment', preparation,
                     COST_NOTE + ' Actual preparation lead is measured, not assumed. Unused/prepared-unused/abandoned visits include final delivery even when completion exceeds the500ms observation. No-session abandonment does not qualify pending-session cancellation.')
    content += table('color-full-traffic', 'Full color phase traffic — original attribution and wire counters', traffic,
                     COST_NOTE + ' raw/gzip are unique observed JS file attribution from the exact arm receipt. Encoded/decoded/transfer and request counters are distinct ResourceTiming observations. Controlled build traffic is never production saving.')
    content += table('color-full-scenario', 'Full color descriptive usage assumptions', timing.get('scenario', []),
                     COST_NOTE + ' usageFraction0/.25/.5/1 is a frozen assumption, not telemetry. J=median(startup)+usage*median(first-ready) is a descriptive index, not session duration or an additional qualification gate.')
    retention = analysis.get('retention') or {}
    content += details('Separate full color retention — original status and scope',
                       {key: retention.get(key) for key in ('status', 'qualified', 'scope')})
    repetitions, checkpoints, heap, pairs = [], [], [], []
    for row in retention.get('rows', []):
        context = {key: row.get(key) for key in ('id', 'block', 'sourceKind', 'arm', 'policy', 'browser', 'profile', 'status', 'completedCycles', 'actualRegistry')}
        repetitions.append({**context, **(row.get('growth') or {}), 'pass': row.get('pass'), 'error': row.get('error'),
                            'finalDetached': row.get('finalDetached'), 'finalDetachedUnsupported': row.get('finalDetachedUnsupported')})
        for point in row.get('checkpoints') or []:
            checkpoints.append({**context, 'cycle': point.get('cycle'), 'heapBytes': point.get('heapBytes'),
                                **unpack('dom.', point.get('dom')), 'connected': point.get('connected')})
    for row in retention.get('heapComparisons', []):
        heap.append({key: value for key, value in row.items() if key != 'pairs'})
        pairs.extend({'sourceKind': row.get('sourceKind'), 'policy': row.get('policy'), **pair} for pair in row.get('pairs', []))
    content += table('color-full-retention', 'Separate full color retention — original repetitions', repetitions, RETENTION_NOTE +
                     ' finalDetached is the original single final diagnostic after all counter checkpoints, not a per-cycle observation or numeric gate. finalDetachedUnsupported preserves an unavailable CDP result explicitly; absence is never zero.')
    content += table('color-full-checkpoints', 'Separate full color retention — original checkpoints', checkpoints,
                     'Better sign: absolute checkpoint counters are not growth. Unsupported diagnostics remain unavailable. Connected DOM census, retained CDP nodes/listeners and heap represent different measurements.')
    content += table('color-full-heap', 'Separate full color retention — paired eager heap comparison', heap, RETENTION_NOTE)
    content += table('color-full-heap-pairs', 'Separate full color retention — original matched growth pairs', pairs, RETENTION_NOTE)
    content += details('Full color every failed, aborted and unstarted terminal result', {'failures': analysis.get('failures'), 'campaignEvents': analysis.get('campaignEvents')})
    return content


def color(data):
    content = color_full(data['analysis']) if 'analysis' in data else ''
    if 'producer' in data:
        producer = data['producer']
        content += details('Static attribution status and exact scope', {key: producer.get(key) for key in ('kind', 'status', 'claim', 'method', 'inputsUnchanged', 'outputsReadbackVerified', 'eligibility')})
        eligibility = producer.get('eligibility', {})
        content += table('color-startup', 'Color static startup attribution',
                         [{'arm': arm, **eligibility.get(arm + 'Startup', {})} for arm in ('reference', 'candidate')],
                         'Better sign: smaller raw/gzip byte totals are smaller emitted closures. These are frozen per-file gzip-6 totals, not observed wire traffic. Producer status complete means attribution completed, not candidate qualification.')
        content += table('color-static-gate', 'Color necessary static gate — producer values',
                         [{key: value for key, value in eligibility.items() if key not in ('referenceStartup', 'candidateStartup')}],
                         SAVING_NOTE + ' matchedSavingFraction is a fraction, not a percentage. Both existing gatePlan thresholds apply. uniqueOptional bytes alone never establish matched route saving.')
    if 'candidate' in data:
        candidate = data['candidate']; summary = candidate.get('summary', {})
        content += details('Observed cold diagnostic status and boundary', {'summary': summary, 'protocol': candidate.get('protocol'), 'decisionPolicy': candidate.get('decisionPolicy'), 'limitations': candidate.get('limitations'), 'error': candidate.get('error'), 'finalizationErrors': candidate.get('finalizationErrors')})
        content += table('color-arms', 'Color cold diagnostic arm statistics', [{'arm': arm, **values} for arm, values in summary.get('arms', {}).items()],
                         COST_NOTE + ' This is one action-only constrained Chromium diagnostic, not the full required matrix or startup/repeat/retention qualification.')
        content += table('color-pairs', 'Color cold diagnostic — every complete matched pair', summary.get('pairs', []), COST_NOTE)
        content += table('color-attempts', 'Color cold diagnostic — every retained attempt',
                         [{**{key: row.get(key) for key in ('block', 'arm', 'ordinal', 'status', 'phase', 'error', 'pageErrors', 'failedRequests')},
                           'durationMs': get(row, 'measurement.durationMs'), 'cancelPreservedDraft': row.get('cancelPreservedDraft')} for row in candidate.get('attempts', [])], COST_NOTE)
    elif 'analysis' not in data:
        content += '<p class="notice">No observed candidate cold timing input supplied. If attribution rejected the mechanism, later campaigns were not run; no timing value or pass is fabricated.</p>'
    if 'baseline' in data:
        baseline = data['baseline']
        content += details('Separate unchanged-eager necessary-condition diagnostic', {'summary': baseline.get('summary'), 'bound': baseline.get('bound'), 'error': baseline.get('error')})
        content += table('color-baseline', 'Baseline diagnostic — original attempts, never pooled',
                         [{**{key: row.get(key) for key in ('attempt', 'index', 'status', 'error')}, 'durationMs': get(row, 'measurement.durationMs')} for row in baseline.get('attempts', [])],
                         'Better sign: lower observed eager duration is faster. The configured cold floor minus eager confidence bound is a necessary-condition calculation, not an observed candidate delta or a speedup. It remains separate from candidate measurements.')
    if 'analysis' not in data:
        content += table('color-retention', 'Separate color retention evidence', [],
                         'Better sign: no retention rows were acquired by these action-only/attribution producers. Empty is not zero growth or a pass. A rejected mechanism needs no fabricated later campaign; promotion requires its separately declared evidence.')
    return content


def census(data):
    result = data['census']
    content = details('Deterministic census status, identity and limits', {key: result.get(key) for key in ('schemaVersion', 'status', 'source', 'rawReceiptSha256', 'completedRouteCells', 'familyObservations', 'sourceUnchanged', 'siteUnchanged', 'limits')})
    rows = []
    for original in result.get('dispositions', []):
        row = {}
        for key, value in original.items():
            if key in ('generatedNodes', 'generatedElements', 'componentPercent', 'routePercent', 'wholeHostNodePercentUpperBound') and isinstance(value, list) and len(value) == 2:
                row[key + '.observedMinimum'] = value[0]
                row[key + '.observedMaximum'] = value[1]
            else:
                row[key] = value
        rows.append(row)
    content += table('census-dispositions', 'Fresh reference census — dispositions and opportunity bounds', rows, SAVING_NOTE + ' Range endpoints are copied from the source, not recalculated. proposedDisposition is copied verbatim and is not rewritten by the presenter.')
    content += table('census-retention', 'Separate retention applicability', [],
                     'Better sign: no retention deltas exist in a source/reference census. These deterministic rejections and opportunities are not candidate timing, retention or manual acceptance evidence.')
    return content


SORTER = r"""for(const s of document.querySelectorAll('[data-comparison]')){const b=s.querySelector('tbody'),r=[...b.rows],q=s.querySelector('input'),status=s.querySelector('[role=status]');q.addEventListener('input',()=>{let n=0;for(const x of r){x.hidden=!x.textContent.toLowerCase().includes(q.value.toLowerCase());if(!x.hidden)n++;}status.textContent=n+' of '+r.length+' rows';});for(const x of s.querySelectorAll('th button')){x.disabled=false;x.addEventListener('click',()=>{const i=Number(x.dataset.index),numeric=x.dataset.type==='number',up=x.parentElement.getAttribute('aria-sort')!=='ascending';for(const th of s.querySelectorAll('th'))th.removeAttribute('aria-sort');x.parentElement.setAttribute('aria-sort',up?'ascending':'descending');r.sort((a,b)=>{const aa=a.cells[i].dataset.value,bb=b.cells[i].dataset.value;if(aa==='')return bb===''?0:1;if(bb==='')return -1;const v=numeric?Number(aa)-Number(bb):aa.localeCompare(bb);return (up?v:-v)||Number(a.dataset.order)-Number(b.dataset.order);});b.append(...r);status.textContent='Sorted by '+x.textContent+', '+(up?'ascending':'descending');});}}"""


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--kind', choices=('editor', 'color', 'census'), required=True)
    parser.add_argument('--input', action='append', default=[], help='analysis|retention|scenario|producer|candidate|baseline|census=/file.json')
    parser.add_argument('--raw', action='append', default=[], help='label=/exact/raw/file; copied without rewriting')
    parser.add_argument('--packed', required=True, help='Existing complete family or Stage B preparation containing packed report assets')
    parser.add_argument('--out', required=True, help='Fresh output, outside every source/prepared/evidence directory')
    args = parser.parse_args()
    inputs, raw = assignments(args.input), assignments(args.raw)
    allowed = {'editor': {'analysis', 'retention', 'scenario'}, 'color': {'producer', 'candidate', 'baseline', 'analysis'}, 'census': {'census'}}[args.kind]
    if not inputs or not set(inputs).issubset(allowed) or (args.kind == 'editor' and 'analysis' not in inputs) or (args.kind == 'census' and 'census' not in inputs):
        raise ValueError('Missing or incompatible named inputs for this wave')
    input_bytes = {key: path.read_bytes() for key, path in inputs.items()}
    input_hashes = {key: hashlib.sha256(value).hexdigest() for key, value in input_bytes.items()}
    data = {key: json.loads(value) for key, value in input_bytes.items()}
    attested_raw = {}
    if args.kind == 'editor':
        if data['analysis'].get('schemaVersion') != 1 or data['analysis'].get('subject') != 'editor-contextual-toolbar':
            raise ValueError('Unexpected editor timing analysis schema')
        if 'retention' in data and (data['retention'].get('schemaVersion') != 1 or data['retention'].get('kind') != 'en-editor-toolbar-retention-v1'):
            raise ValueError('Unexpected editor retention schema')
        if 'scenario' in data:
            scenario = data['scenario']
            if scenario.get('schemaVersion') != 1 or scenario.get('kind') != 'editor-descriptive-scenario-index' or get(scenario, 'analysis.sha256') != input_hashes['analysis']:
                raise ValueError('Scenario is not bound to this exact editor analysis')
            for binding in scenario.get('rawInputs', []):
                if sha(binding['path']) != binding['sha256']:
                    raise ValueError('Scenario raw input changed')
                attested_raw[str(Path(binding['path']).resolve())] = binding['sha256']
    if args.kind == 'color' and 'analysis' in data:
        analysis = data['analysis']
        if analysis.get('schemaVersion') != 1 or analysis.get('kind') != 'composable-chat-color-full-analysis':
            raise ValueError('Unexpected full color analysis schema')
        if not isinstance(analysis.get('rawInputs'), list) or not analysis['rawInputs']:
            raise ValueError('Full color analysis lacks original captured input fingerprints')
        for binding in analysis['rawInputs']:
            path = Path(binding['path']).resolve(strict=True)
            if str(path) in attested_raw or sha(path) != binding['sha256']:
                raise ValueError('Duplicate/changed analyzer-attested full color input')
            attested_raw[str(path)] = binding['sha256']
        for phase in ('timing', 'retention'):
            acquisition = (analysis.get('provenance') or {}).get(phase)
            if acquisition:
                for name in ('manifest.json', 'summary.json', 'samples.jsonl', *(['server-prewarm.json'] if 'server-prewarm.json' in acquisition.get('files', {}) else [])):
                    path = inside(Path(acquisition['path']).resolve(), name)
                    if acquisition.get('files', {}).get(name) != attested_raw.get(str(path)):
                        raise ValueError('Full color acquisition differs from captured analyzer input')
                    raw['color-full-' + phase + '-' + Path(name).stem] = path
        bindings = analysis.get('inputBindings') or {}
        for name, binding_name in (('producer', 'producer'), ('candidate', 'cold')):
            if name in data and input_hashes[name] != (bindings.get(binding_name) or {}).get('sha256'):
                raise ValueError('Additional color evidence is from a different full campaign: ' + name)
        for name in ('producer', 'cold'):
            declaration = bindings.get(name) or {}
            for field in ('path', 'sidecarPath', 'rawPath'):
                if declaration.get(field):
                    path = Path(declaration[field]).resolve(strict=True)
                    if str(path) not in attested_raw:
                        raise ValueError('Full color original evidence lacks analyzer fingerprint')
                    raw['color-full-' + name + '-' + field.lower()] = path
    if args.kind == 'color':
        for name, kind in (('producer', 'en-reve-color-cold-assets'), ('candidate', 'composable-chat-matched-cold-color-diagnostic')):
            if name in data and (data[name].get('schemaVersion') != 1 or data[name].get('kind') != kind):
                raise ValueError('Unexpected color ' + name + ' schema')
        if 'baseline' in data and (data['baseline'].get('schemaVersion') != 2 or data['baseline'].get('route') != '/api-examples/composable-chat.html'):
            raise ValueError('Unexpected current color baseline schema')
    if args.kind == 'census' and (data['census'].get('schemaVersion') != 1 or not isinstance(data['census'].get('dispositions'), list)):
        raise ValueError('Unexpected current deterministic census schema')
    packed, out = Path(args.packed).resolve(strict=True), Path(args.out).resolve()
    manifest_path = packed / 'manifest.json'; manifest_bytes = manifest_path.read_bytes(); manifest = json.loads(manifest_bytes)
    manifest_hash = hashlib.sha256(manifest_bytes).hexdigest()
    if manifest.get('status') != 'complete':
        raise ValueError('Report assets require a completed packed preparation')
    protected = [packed, *(path.parent for path in inputs.values()), *(path.parent for path in raw.values())]
    for source in manifest.get('sources', {}).values():
        for key in ('snapshot', 'origin'):
            if source.get(key):
                protected.append(Path(source[key]).resolve())
    asset = manifest.get('reportAssets')
    stage_b = asset is None
    if stage_b:
        variants = [value for value in manifest.get('variants', []) if value.get('family') == 'report']
        if len(variants) != 1:
            raise ValueError('Expected one existing packed report asset variant')
        asset = variants[0]
    elif asset.get('specifier') != '@en-reve/elements/define/table.js':
        raise ValueError('Expected explicitly registered packed en-table asset')
    receipt_path = inside(packed, asset['receipt'])
    receipt_bytes = receipt_path.read_bytes()
    if hashlib.sha256(receipt_bytes).hexdigest() != asset['receiptSha256']:
        raise ValueError('Packed report receipt changed')
    receipt = json.loads(receipt_bytes); asset_root = inside(packed, asset['root']) / 'site'
    declared = {item['path']: item for item in receipt['assets']}
    if len(declared) != len(receipt['assets']):
        raise ValueError('Duplicate report asset paths')
    if set(declared) != {str(path.relative_to(asset_root)) for path in asset_root.rglob('*') if path.is_file()}:
        raise ValueError('Packed report asset file set changed')
    for name, item in declared.items():
        if sha(inside(asset_root, name)) != item['sha256']:
            raise ValueError('Packed report asset changed: ' + name)
    entry = 'boot.js' if stage_b else asset['entry']
    if entry not in declared:
        raise ValueError('Report entry absent from its exact receipt')
    issues = []
    if args.kind == 'color' and 'analysis' in data:
        protected.extend(Path(path).resolve() for path in data['analysis'].get('protectedRoots', []))
    if args.kind == 'color' and data.get('producer', {}).get('prepared'):
        producer_prepared = Path(data['producer']['prepared']).resolve()
        protected.append(producer_prepared)
        # Presentation assets may come from a different preparation than measured color inputs.
        producer_manifest = read(producer_prepared / 'manifest.json')
        for producer_source in producer_manifest.get('sources', {}).values():
            for key in ('snapshot', 'origin'):
                if producer_source.get(key):
                    protected.append(Path(producer_source[key]).resolve())
    if args.kind == 'color':
        candidate = data.get('candidate', {})
        for distribution in candidate.get('distributions', {}).values():
            protected.append(Path(distribution).resolve())
        for site in candidate.get('sitesBefore', {}).values():
            for key in ('inventoryPath', 'receiptPath'):
                if site.get(key):
                    protected.append(Path(site[key]).resolve().parent)
        baseline = data.get('baseline', {})
        if baseline.get('distribution'):
            protected.append(Path(baseline['distribution']).resolve())
        for key in ('frozenReceiptPath', 'graphPath'):
            if baseline.get(key):
                protected.append(Path(baseline[key]).resolve().parent)
    if args.kind == 'editor':
        source = data['analysis'].get('inputDirectory')
        if source:
            protected.append(Path(source).resolve())
        timing_preparation = get(data['analysis'], 'inputs.manifest.preparation') or {}
        if timing_preparation.get('path'):
            protected.append(Path(timing_preparation['path']).resolve())
        for timing_source in timing_preparation.get('sources', {}).values():
            for key in ('snapshot', 'origin'):
                if timing_source.get(key):
                    protected.append(Path(timing_source[key]).resolve())
        for name, expected in data['analysis'].get('inputSha256', {}).items():
            path = inside(Path(source).resolve(), name)
            if sha(path) != expected:
                raise ValueError('Analyzer-attested editor input changed: ' + name)
            if str(path) in attested_raw and attested_raw[str(path)] != expected:
                raise ValueError('Editor scenario and analyzer raw identities disagree')
            attested_raw[str(path)] = expected
            raw['editor-timing-' + Path(name).stem] = path
        if not source or not data['analysis'].get('inputSha256'):
            issues.append('Editor timing raw linkage was not supplied by this analysis; no acquisition identity is inferred.')
        if 'retention' in data:
            retention_prepared = get(data['retention'], 'preparation.path')
            if retention_prepared:
                protected.append(Path(retention_prepared).resolve())
            for retention_source in (get(data['retention'], 'preparation.sources') or {}).values():
                for key in ('snapshot', 'origin'):
                    if retention_source.get(key):
                        protected.append(Path(retention_source[key]).resolve())
            timing_sha = get(data['analysis'], 'inputs.manifest.preparation.sha256')
            retention_sha = get(data['retention'], 'preparation.sha256')
            if timing_sha and retention_sha and timing_sha != retention_sha:
                raise ValueError('Editor timing and retention use different preparations; present them separately')
            if not timing_sha or not retention_sha:
                issues.append('Shared editor timing/retention preparation identity could not be verified from both input fields.')
    for label, path in inputs.items():
        names = ('events.jsonl', 'started.json', 'identity-before.json') if label == 'retention' else ('attempts.jsonl', 'acquisition.json', 'started.json') if label in ('candidate', 'baseline') else ('producer.sha256.json', 'optional-assets.json') if label == 'producer' else ()
        for name in names:
            sibling = path.parent / name
            if sibling.is_file():
                raw[label + '-' + Path(name).stem] = sibling
            elif name.endswith('.jsonl'):
                issues.append(label + ': original append-only ' + name + ' unavailable; see full JSON and do not infer complete raw coverage.')
    if args.kind == 'census' and data['census'].get('rawReceiptSha256') not in {sha(path) for path in raw.values()}:
        issues.append('Census exact raw receipt has not been supplied/matched to rawReceiptSha256. Add --raw census-receipt=/original/file.')
    protected.extend(path.parent for path in raw.values())
    if out.exists() or any(out.is_relative_to(path) for path in protected):
        raise ValueError('Output must be fresh and outside sealed/evidence inputs')
    output_inputs = {**{'input-' + key: path for key, path in inputs.items()}, **{'raw-' + key: path for key, path in raw.items()},
                     'packed-manifest': manifest_path, 'packed-report-receipt': receipt_path}
    before = {key: sha(path) for key, path in output_inputs.items()}
    for key, path in output_inputs.items():
        expected = attested_raw.get(str(path.resolve()))
        if expected and before[key] != expected:
            raise ValueError('Attested raw input changed before copy: ' + key)
    for key, expected in input_hashes.items():
        if before['input-' + key] != expected:
            raise ValueError('Parsed input changed before report copy: ' + key)
    if before['packed-manifest'] != manifest_hash:
        raise ValueError('Parsed packed manifest changed before report copy')
    if before['packed-report-receipt'] != asset['receiptSha256']:
        raise ValueError('Packed report receipt changed before report copy')
    out.mkdir(); evidence = out / 'evidence'; evidence.mkdir()
    shutil.copytree(asset_root, out / 'report-assets')
    links, identities = [], []
    for key, path in output_inputs.items():
        suffix = ''.join(path.suffixes) or '.bin'
        name = key + suffix
        target = evidence / name; shutil.copyfile(path, target)
        if sha(path) != before[key] or sha(target) != before[key]:
            raise ValueError('Evidence changed during report copy: ' + key)
        links.append(f'<li><a href="evidence/{display(name)}">{display(key)}</a> · SHA256 <code>{before[key]}</code></li>')
        identities.append({'label': key, 'source': str(path), 'copy': 'evidence/' + name, 'sha256': before[key]})
    title = {'editor': 'Contextual editor toolbar evidence', 'color': 'Inline color delivery evidence', 'census': 'Fresh deterministic family dispositions'}[args.kind]
    content = '<header><p>En Rêve · current lazy delivery rollout</p><h1>' + title + '</h1><p>Presentation of existing evidence. No statistics, gates, completion, promotion or user review state are computed here.</p><a href="http://127.0.0.1:4177/">Progress Report</a></header>'
    if issues:
        content += '<section class="notice"><h2>Missing presentation inputs</h2><ul>' + ''.join('<li>' + display(issue) + '</li>' for issue in issues) + '</ul></section>'
    content += {'editor': editor, 'color': color, 'census': census}[args.kind](data)
    content += '<section id="raw"><h2>Exact raw evidence and provenance</h2><p>All links are copied original bytes. Presentation-time hashes do not retroactively attest acquisition. Analyzer-attested hashes are verified where supplied. Packed en-table assets are presentation dependencies, separate from measured consumer sources. Failed, aborted, partial and unsupported results retain their original status.</p><ul>' + ''.join(links) + '</ul></section>'
    css = 'body{margin:0;background:#f4f6f0;color:#19372b;font:15px/1.5 system-ui}main{max-width:1600px;margin:auto;padding:32px}header,section,details{background:white;padding:20px;margin:20px 0;border:1px solid #d5e0d2;border-radius:10px}header{background:#e4eddf}h1{font-size:36px}a{color:#15563d}en-table{display:block;overflow:auto}table{border-collapse:collapse;width:100%;font-size:13px}td,th{padding:8px;text-align:left;vertical-align:top;border-bottom:1px solid #d5e0d2;max-width:36rem;overflow-wrap:anywhere}th{white-space:nowrap;background:#edf3e9}button,input{font:inherit}th button{border:0;background:transparent;color:inherit;font-weight:bold;cursor:pointer}.direction{padding:12px;border-left:3px solid #4d7459;background:#edf3e9}.notice{border-color:#967640}pre{white-space:pre-wrap;overflow-wrap:anywhere}code{overflow-wrap:anywhere}tr[hidden]{display:none}'
    scripts = f'<script type="module" src="./report-assets/{display(entry)}"></script>'
    if not stage_b:
        scripts += '<script type="module">' + SORTER + '</script>'
    document = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + title + '</title><style>' + css + '</style></head><body><main>' + content + '</main>' + scripts + '</body></html>'
    (out / 'index.html').write_text(document)
    for root in (asset_root, out / 'report-assets'):
        if set(declared) != {str(path.relative_to(root)) for path in root.rglob('*') if path.is_file()}:
            raise ValueError('Packed report asset file set changed during presentation')
    for name, item in declared.items():
        if sha(inside(out / 'report-assets', name)) != item['sha256'] or sha(inside(asset_root, name)) != item['sha256']:
            raise ValueError('Packed report assets changed during presentation')
    for path, expected in attested_raw.items():
        if sha(path) != expected:
            raise ValueError('Analyzer-attested input changed during presentation: ' + path)
    (out / 'report-receipt.json').write_text(json.dumps({'kind': 'lazy-delivery-output-only-presentation', 'wave': args.kind,
        'reportSha256': sha(out / 'index.html'), 'presenterSha256': sha(__file__), 'inputs': identities,
        'packedReportReceiptSha256': asset['receiptSha256'], 'presentationIssues': issues,
        'statusPolicy': 'Source statuses displayed verbatim; no acceptance computed or review state changed.'}, indent=2) + '\n')
    print(out / 'index.html')


if __name__ == '__main__':
    main()
