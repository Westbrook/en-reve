/** Executed only after copying this frozen helper beside packed-vite-build.mjs in an isolated subject. */
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { packedBuild } from './packed-vite-build.mjs';

const context = JSON.parse(await readFile(process.argv[2], 'utf8'));
const { build } = await import(pathToFileURL(resolve(context.sourceRoot, 'node_modules/vite/dist/node/index.js')));
const { minifyLitTemplates } = await import(pathToFileURL(resolve(context.sourceRoot, 'tooling/minify/literals.mjs')));
await packedBuild(build, {
  root: context.sourceRoot, configFile: false,
  plugins: [minifyLitTemplates({ include: [context.packedRoot] })],
  build: {
    target: 'es2022', outDir: context.outDir, emptyOutDir: false, sourcemap: false, minify: true,
    lib: { entry: context.entry, formats: ['es'], fileName: 'entry' },
    rolldownOptions: { output: { entryFileNames: 'entry.js', chunkFileNames: 'assets/[name]-[hash].js', assetFileNames: 'assets/[name]-[hash][extname]', strictExecutionOrder: true } },
  },
}, { ...context, additionalSourceRoots: [dirname(context.entry)] });
