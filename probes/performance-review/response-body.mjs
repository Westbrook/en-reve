/** Bind the actual main-document response without Playwright's smaller body cache. */
export async function navigationBodyCapture(session, page, expectedBytes) {
  const maxResourceBufferSize = Math.max(1024 * 1024, expectedBytes * 2);
  const maxTotalBufferSize = maxResourceBufferSize * 2;
  if (!Number.isSafeInteger(expectedBytes) || expectedBytes < 1 || maxTotalBufferSize > 0x7fffffff) {
    throw new Error('A bounded positive document size is required for response capture.');
  }
  const { frameTree } = await session.send('Page.getFrameTree');
  const frameId = frameTree.frame.id;
  const documents = new Map();
  session.on('Network.responseReceived', event => {
    if (event.type === 'Document' && event.frameId === frameId) documents.set(event.requestId, event.response);
  });
  const buffers = { maxResourceBufferSize, maxTotalBufferSize };
  await session.send('Network.enable', buffers);
  return {
    policy: { protocol: 'owned-cdp-document-body-v1', ...buffers },
    async read(response) {
      if (!response || response.frame() !== page.mainFrame() || !response.request().isNavigationRequest()) {
        throw new Error('Response capture requires this page\'s main navigation response.');
      }
      const failure = await response.finished();
      if (failure) throw failure;
      const matches = [...documents].filter(([, item]) => item.url === response.url() && item.status === response.status());
      if (matches.length !== 1) throw new Error(`Expected one matching main-document response, found ${matches.length}.`);
      const [requestId] = matches[0];
      const result = await session.send('Network.getResponseBody', { requestId });
      return {
        bytes: Buffer.from(result.body, result.base64Encoded ? 'base64' : 'utf8'),
        requestId, url: response.url(), status: response.status(),
      };
    },
  };
}
