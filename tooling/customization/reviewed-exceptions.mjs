/** Explicit source-review decisions for THEME-01. Each exception is required to
 * match a current finding; additions never receive a wildcard exemption. */
export const reviewedExceptions = [
  {
    code: 'missing-element-annotation', cssNames: ['--en-tab-background', '--en-tab-color'],
    reason: 'Existing CSS tab paint hooks have style consumers and registry documentation but no per-element annotation. No new element support or Part mapping is inferred.',
    source: 'packages/styles/src/selection.ts',
  },
  {
    code: 'missing-element-annotation', cssNames: ['--en-inset-outer-radius', '--en-inset-distance', '--en-inset-child-radius'],
    reason: 'Inset-radius composition is a CSS recipe contract; element-specific applicability is not declared. Registry and source evidence document the recipe without invented element annotations.',
    source: 'packages/styles/src/css/surface.css',
  },
  {
    code: 'missing-element-annotation', cssNames: ['--en-file-list-gap', '--en-file-list-padding', '--en-file-list-media-size', '--en-file-list-metadata-gap'],
    reason: 'File-list recipe hooks are consumed by CSS recipes, with no dedicated element annotation. The registry documents these CSS-only surfaces.',
    source: 'packages/styles/src/content.ts',
  },
  {
    code: 'missing-element-annotation', cssNames: ['--en-cluster-gap', '--en-grid-gap', '--en-grid-item-min'],
    reason: 'Cluster and grid are CSS layout recipes with no corresponding custom element in the catalog. Element annotations would imply an unsupported component.',
    source: 'packages/styles/src/surfaces.ts',
  },
  {
    code: 'missing-element-annotation', cssNames: ['--en-media-radius', '--en-media-aspect-ratio'],
    reason: 'Media hooks belong to the CSS media recipe and have no dedicated catalog custom element. Registry documentation preserves this scope.',
    source: 'packages/styles/src/feedback.ts',
  },
  {
    code: 'missing-element-annotation', cssNames: ['--en-divider-color'],
    reason: 'Divider is a CSS recipe without a corresponding custom element. Its source consumers and registry documentation are the supported contract.',
    source: 'packages/styles/src/css/surface.css',
  },
  {
    code: 'missing-element-annotation', cssNames: ['--en-prose-max-inline-size'],
    reason: 'Prose is a CSS recipe without a corresponding custom element. Its source consumers and registry documentation are the supported contract.',
    source: 'packages/styles/src/css/typography.css',
  },
];

export function applyReviewedExceptions(findings, exceptions = reviewedExceptions) {
  const remaining = new Map(exceptions.flatMap(exception => exception.cssNames.map(cssName => [`${exception.code}:${cssName}`, exception])));
  const annotated = findings.map(finding => {
    const key = `${finding.code}:${finding.cssName}`;
    const exception = remaining.get(key);
    if (!exception || !exception.reason?.trim() || !finding.sources?.includes(exception.source)) return { ...finding, reviewed: false };
    remaining.delete(key);
    return { ...finding, reviewed: true, reason: exception.reason, reviewedSource: exception.source };
  });
  return { findings: annotated, staleExceptions: [...remaining].map(([key, exception]) => ({ key, reason: exception.reason })) };
}
