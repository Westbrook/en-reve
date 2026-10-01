import { createServer } from 'vite';

const server = await createServer({
  configFile: false,
  root: new URL('.', import.meta.url).pathname,
  server: { host: '127.0.0.1', port: 4182, strictPort: true, fs: { allow: [new URL('../../../../', import.meta.url).pathname] } },
});
await server.listen();
