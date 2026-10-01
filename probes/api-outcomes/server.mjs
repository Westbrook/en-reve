import { createServer } from 'vite';
const root = process.cwd();
const server = await createServer({ configFile: false, root, optimizeDeps: { noDiscovery: true, include: [] }, resolve: { alias: ['elements', 'primitives', 'styles'].map(name => ({ find: new RegExp('^@en-reve/' + name + '/(.*)\\.js$'), replacement: root + '/packages/' + name + '/src/$1.ts' })) }, server: { host: '127.0.0.1', port: 4495, strictPort: true } });
await server.listen();
