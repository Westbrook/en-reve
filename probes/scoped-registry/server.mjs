import {scopeEndpoint} from './port.mjs';
import { createServer } from 'vite';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const endpoint=scopeEndpoint(process.env);
const server = await createServer({
  root: '.', server: { host: endpoint.host, port: endpoint.port, strictPort: true },
  plugins: [{
    name: 'packed-registry-fixture',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!process.env.EN_SCOPED_REGISTRY_OUT || req.url?.split('?')[0] !== '/artifacts/scoped-registry-phase-2/packed/fixture.js') return next();
        try {
          res.setHeader('Content-Type', 'application/javascript');
          res.end(await readFile(resolve(process.env.EN_SCOPED_REGISTRY_OUT, 'fixture.js')));
        } catch (error) { next(error); }
      });
    },
  }],
});
await server.listen();
