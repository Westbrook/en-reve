import assert from 'node:assert/strict';

const currentName = 'Spectrum WC Gen2 + Gen1';
const isSpectrum = name => ['Spectrum Web Components', currentName].includes(name);
const md = (headers, rows) => [headers, headers.map(() => '---'), ...rows].map(r => `| ${r.join(' | ')} |`).join('\n') + '\n';
const tablePattern = /(?:\|[^\n]*\|\n?)+/;
const parse = text => text.trim().split('\n').map(line => line.split('|').slice(1, -1).map(v => v.trim()));
const note = 'Spectrum WC rows below now use **@adobe/spectrum-wc 2.0.0-beta.3 + Gen1 1.12.2 controls**, measured September 22. Acquisition IDs distinguish this refresh from the retained historical peers. These mixed-session rows are descriptive, not paired comparisons. See [the new Spectrum cohort](#spectrum-gen2-comparison) for contemporaneous En Reve/Fluent controls and versioned evidence. Prior Gen1 results remain in the [retained pre-refresh report](../showcases/performance/reports/spectrum-gen2/prior-results.md).';

/** Replace only selected implementation rows, preserving unrelated acquisitions. */
export function integrateSpectrumGen2Main(markdown, current) {
  const receipts = [];
  const aliases = {
    'Production payload sizes': 'production payload sizes', 'Chunk structure': 'emitted chunk structure',
    'Historical connected DOM diagnostics': 'diagnostic coverage',
    'Historical exercised code coverage': 'exercised code coverage',
    'Historical rendering trace through LCP': 'trace through diagnostic LCP',
    'Historical back-forward cache checks': 'back-forward cache checks',
    'Historical observer overhead calibration': 'observer overhead calibration',
  };
  const boundary = markdown.indexOf('<!-- BEGIN WEB AWESOME -->');
  const prefix = (boundary < 0 ? markdown : markdown.slice(0, boundary)).replace('It measures all eight frozen native showcases', 'It measures the nine-system native panel and retains versioned refreshes');
  const suffix = boundary < 0 ? '' : markdown.slice(boundary);
  let next = prefix.replace(/(^### ([^\n]+)\n)([\s\S]*?)(?=^#{1,3} |$(?![\s\S]))/gm, (section, heading, title, rest) => {
    const mapped = aliases[title] ?? title.replace('startup click', 'startup usability').replace('action details', 'individual actions');
    const source = current.tables.find(t => t.title.toLowerCase() === `Spectrum Gen2 ${mapped}`.toLowerCase());
    if (!source || !tablePattern.test(rest)) return section;
    const match = rest.match(tablePattern)[0], [headers, , ...oldRows] = parse(match);
    if (headers[0] !== 'Implementation' || !oldRows.some(r => isSpectrum(r[0]))) return section;
    const dated = headers.includes('Run ID');
    const finalHeaders = headers.includes('Acquisition') || dated ? headers : [headers[0], 'Acquisition', ...headers.slice(1)];
    const cols = finalHeaders.map(h => ['Acquisition', 'Run ID', 'Date (UTC)'].includes(h) ? -1 : source.headers.indexOf(h));
    assert(cols.every((c, i) => c >= 0 || ['Acquisition', 'Run ID', 'Date (UTC)'].includes(finalHeaders[i])), `Missing columns for ${title}`);
    let selected = source.rows.filter(r => r[0] === currentName);
    if (title === 'Historical observer overhead calibration') selected = selected.filter(r => r[source.headers.indexOf('Profile')] === 'desktop');
    assert(selected.length, `No refreshed rows for ${title}`);
    const added = selected.map(r => cols.map((c, i) => ['Acquisition', 'Run ID'].includes(finalHeaders[i]) ? source.source : finalHeaders[i] === 'Date (UTC)' ? '—' : r[c]));
    const rows = oldRows.filter(r => !isSpectrum(r[0])).map(r => headers.includes('Acquisition') || dated ? r : [r[0], 'Historical; see original source note', ...r.slice(1)]);
    const position = oldRows.findIndex(r => isSpectrum(r[0])); rows.splice(position, 0, ...added);
    receipts.push({ title, source: source.source, previous: oldRows.filter(r => isSpectrum(r[0])), headers: finalHeaders, rows });
    const disclosure = '\nSpectrum refreshed from the versioned [new acquisition](#spectrum-gen2-comparison); other rows retain their indicated historical acquisitions.\n';
    return heading + (rest.includes(disclosure.trim()) ? '' : disclosure) + rest.replace(match, md(finalHeaders, rows));
  });
  assert(receipts.some(t => t.title === 'mobile cold loading'), 'Loading table was not refreshed');
  // Keep the compact opening comparison and rendering excerpt in sync.
  next = next.replace(/(## First reference comparison\n)([\s\S]*?)(?=\n## )/, (all, heading, rest) => {
    rest = rest.replace('The original eight rows below retain the 30-block first reference.', 'Seven rows below retain the 30-block first reference; Spectrum now uses its explicitly labelled 10-sample Gen2 refresh.').replace('The original eight reference rows use the frozen default native CSR implementation', 'The original eight-system reference acquisition used the frozen default native CSR implementation');
    const match = rest.match(tablePattern); assert(match);
    const [headers, , ...oldRows] = parse(match[0]);
    const payload = current.tables.find(t => t.title === 'Spectrum Gen2 production payload sizes');
    const load = current.tables.find(t => t.title === 'Spectrum Gen2 mobile cold loading');
    const value = (t, h) => t.rows.find(r => r[0] === currentName)[t.headers.indexOf(h)];
    const row = [currentName, load.source, value(load, 'Successful n'), value(payload, 'Initial JS Brotli KiB'), value(payload, 'JS Brotli KiB'), value(payload, 'CSS Brotli KiB'), value(load, 'LCP ms'), value(load, 'LCP p75 ms')];
    if(headers.includes('Date (UTC)')) row.splice(headers.indexOf('Date (UTC)'),0,'—');
    assert.equal(headers.length, row.length);
    const rows = oldRows.map(r => isSpectrum(r[0]) ? row : r);
    receipts.push({ title: 'First reference comparison', source: load.source, headers, rows });
    return heading + (rest.includes(note) ? '' : '\n' + note + '\n') + rest.replace(match[0], md(headers, rows));
  });
  const dom = receipts.find(t => t.title === 'Historical connected DOM diagnostics'); assert(dom);
  next = next.replace(/(## Rendering and interaction evidence\n)([\s\S]*?)(?=\n## )/, (all, heading, rest) => heading + (rest.includes(note) ? '' : '\n' + note + '\n') + rest.replace(tablePattern, md(dom.headers, dom.rows)));
  if (!next.includes(note)) next = next.replace('## Loading and visual stability\n', '## Loading and visual stability\n\n' + note + '\n');
  else if (!next.slice(next.indexOf('## Loading and visual stability'), next.indexOf('### mobile cold loading')).includes(note)) next = next.replace('## Loading and visual stability\n', '## Loading and visual stability\n\n' + note + '\n');
  const domHistoryNote = '\nThis retained source audit and its tables describe the earlier Gen1 Spectrum artifact. For the refreshed build, see [Spectrum Gen2 connected totals and date exclusions](#spectrum-gen2-connected-totals-with-and-without-dates).\n';
  if (!next.includes(domHistoryNote.trim())) next = next.replace('## Connected DOM review\n', '## Connected DOM review\n' + domHistoryNote);
  const top = '\nCurrent Spectrum rows use the Gen2 + Gen1 label. Older sections and retained paired contrasts that still say Spectrum Web Components describe the earlier Gen1 1.12.2 artifact; see the [September 22 refresh](#spectrum-gen2-comparison) for current measurements.\n';
  if (!next.includes(top.trim())) next = next.replace(/^(# [^\n]+\n)/, '$1' + top);
  return { markdown: next + suffix, receipts };
}
