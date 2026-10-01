import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../../../../', import.meta.url));
const server = await createServer({root, configFile:false,
  cacheDir:`${root}/node_modules/.cache/en-action-leaves-tests`,
  optimizeDeps:{entries:[`${root}/packages/styles/tests/action-leaves/fixture.ts`]},
  server:{host:'127.0.0.1',port:4471,strictPort:true},
});
await server.listen();
