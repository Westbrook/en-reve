import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
const root = fileURLToPath(new URL('../../../../', import.meta.url));
const server = await createServer({
  root,
  configFile: false,
  server: { host: '127.0.0.1', port: Number(process.env.EN_BUTTON_TEST_PORT ?? 4393), strictPort: true },
  optimizeDeps: { entries: [resolve(root, 'packages/elements/src/button/content-fixture.html')] },
});
await server.listen();
