import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../../../../', import.meta.url));
export default defineConfig({
	root,
	resolve: { alias: [
		{ find: /^@en-reve\/primitives\/(.*)\.js$/, replacement: `${root}packages/primitives/src/$1.ts` },
		{ find: /^@en-reve\/styles\/(.*)\.js$/, replacement: `${root}packages/styles/src/$1.ts` },
	] },
	server: { host: '127.0.0.1', port: Number(process.env.EN_RATING_TEST_PORT ?? 4493), strictPort: true, hmr: false, watch: null },
});
