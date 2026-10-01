import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';

/** Redirect only the package loader, so our grammar can import the original. */
export function litHighlighting(): Plugin {
	const grammar = fileURLToPath(new URL('./lit-typescript.ts', import.meta.url));
	return {
		name: 'en-reve-lit-highlighting',
		enforce: 'pre',
		resolveId(source, importer) {
			const request = source.replaceAll('\\', '/').split('?')[0]!;
			const from = importer?.replaceAll('\\', '/').split('?')[0];
			if ((request === './grammars/typescript.js' || request.endsWith('/microlighter/dist/grammars/typescript.js')) && from?.endsWith('/microlighter/dist/grammar-dependencies.js')) {
				return grammar;
			}
		},
	};
}
