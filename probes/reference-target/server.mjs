import { createServer } from 'vite';
import { execFileSync } from 'node:child_process';
const ownedSsr = execFileSync(process.execPath, ['probes/reference-target/owned-ssr.mjs'], { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
const islandPages = JSON.parse(execFileSync(process.execPath, ['probes/reference-target/island-ssr.mjs'], { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 }));
const server = await createServer({ configFile: false, root: process.cwd(),
  optimizeDeps: { noDiscovery: true, include: [] },
  server: { host: '127.0.0.1', port: 47853, strictPort: true },
  plugins: [{ name: 'owned-label-ssr-fixture', configureServer(server) {
    for (const [delivery, markup] of Object.entries(islandPages)) server.middlewares.use(`/probes/reference-target/island-${delivery}.html`, async (_req, res, next) => {
      try { res.setHeader('content-type', 'text/html'); res.end(await server.transformIndexHtml(`/probes/reference-target/island-${delivery}.html`, markup)); }
      catch (error) { next(error); }
    });
    server.middlewares.use('/probes/reference-target/owned-ssr.html', async (_req, res, next) => {
      try {
        res.setHeader('content-type', 'text/html');
        res.end(await server.transformIndexHtml('/probes/reference-target/owned-ssr.html', ownedSsr));
      } catch (error) { next(error); }
    });
  } }],
});
await server.listen();
