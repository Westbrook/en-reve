import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';

const server = await createServer({
  configFile: false,
  root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [{
    name: 'native-overlay-theme',
    configureServer(server) {
      server.middlewares.use('/theme.css', (_request, response, next) => {
        readFile(new URL('../../../../tokens/dist/default.css', import.meta.url))
          .then(css => { response.setHeader('Content-Type', 'text/css'); response.end(css); })
          .catch(next);
      });
    },
  }],
  server: { host: '127.0.0.1', port: Number(process.env.EN_OVERLAY_TEST_PORT ?? 42786), strictPort: true },
});
await server.listen();
