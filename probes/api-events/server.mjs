import { createServer } from 'vite';
const server = await createServer({
 configFile: false, root: process.cwd(),
 server: {host: '127.0.0.1', port: 4491, strictPort: true},
});
await server.listen();
