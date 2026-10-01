import { parse } from 'parse5';

function find(node, tagName) {
  if (node.tagName === tagName) return node;
  for (const child of node.childNodes ?? []) {
    const result = find(child, tagName);
    if (result) return result;
  }
}

/** Locate structural insertion points with an HTML parser; preserve SSR bytes. */
function injectApplication(shell, { markup, css }, tagName) {
  const document = parse(shell, { sourceCodeLocationInfo: true });
  const app = find(document, tagName);
  const head = find(document, 'head');
  const appLocation = app?.sourceCodeLocation;
  const headLocation = head?.sourceCodeLocation;
  if (!appLocation?.startTag || !appLocation.endTag || !headLocation?.endTag) {
    throw new Error(`The documentation shell must contain an ${tagName} and a head.`);
  }
  if (css.toLowerCase().includes('</style')) throw new Error('Generated theme CSS cannot close its style element.');
  const edits = [
    { start: appLocation.startTag.endOffset - 1, end: appLocation.endTag.startOffset, value: ` data-ssr>${markup}` },
    { start: headLocation.endTag.startOffset, end: headLocation.endTag.startOffset, value: `<style id="en-preview-theme">${css}</style>` },
  ];
  // Avoid reparsing and serializing DSD: textarea's parser-normalized leading
  // newline would otherwise need to be reconstructed before the next parse.
  return edits.sort((a, b) => b.start - a.start).reduce((html, edit) => html.slice(0, edit.start) + edit.value + html.slice(edit.end), shell);
}

export function injectStickerSheet(shell, rendered) {
  return injectApplication(shell, rendered, 'en-sticker-app');
}

export function injectWorkflows(shell, rendered) {
  return injectApplication(shell, rendered, 'en-workflows-app');
}

export function injectThemeReview(shell, rendered) {
  return injectApplication(shell, rendered, 'en-theme-review-app');
}

export function injectAPIReference(shell, rendered) {
  return injectApplication(shell, rendered, 'en-api-reference-app');
}

export function injectAPIExample(shell, rendered) {
  return injectApplication(shell, rendered, 'en-api-example-app');
}

/** Bind the loaded SSR document to its normalized build identity. */
export function injectReviewBuild(shell, fingerprint) {
  const head = find(parse(shell, {sourceCodeLocationInfo:true}), 'head');
  const offset = head?.sourceCodeLocation?.endTag?.startOffset;
  if (offset === undefined) throw new Error('Review build metadata requires a head.');
  return shell.slice(0,offset) + `<meta name="en-review-build" content="${fingerprint}">` + shell.slice(offset);
}

export function injectShowcase(shell, rendered) {
  return injectApplication(shell, rendered, 'en-showcase-app');
}

export function injectConversation(shell, rendered) {
  return injectApplication(shell, rendered, 'en-conversation-app');
}
