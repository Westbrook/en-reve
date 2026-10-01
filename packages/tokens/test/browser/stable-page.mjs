/** Keep a loaded fixture stable while other workspace agents edit modules.
 * This only filters the development server's HMR update/reload notifications;
 * application events and all other socket messages (including errors) continue.
 */
export async function stabilizePreview(page, baseURL) {
  const origin = new URL(baseURL);
  await page.routeWebSocket(url => url.host === origin.host && url.pathname === '/' && url.searchParams.has('token'), socket => {
    const server = socket.connectToServer();
    server.onMessage(message => {
      if (typeof message === 'string') {
        try {
          const notification = JSON.parse(message);
          if (notification.type === 'update' || notification.type === 'full-reload') return;
        } catch { /* Non-JSON messages pass through unchanged. */ }
      }
      socket.send(message);
    });
  });
}
