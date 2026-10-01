import {pathToFileURL} from 'node:url';
// Reuse an installed build tool, never another checkout's source or generated assets.
const location=process.env.EN_DIAGNOSTICS_ESBUILD
  ?pathToFileURL(process.env.EN_DIAGNOSTICS_ESBUILD)
  :new URL('../../showcases/performance/node_modules/esbuild/lib/main.js',import.meta.url);
export const {build,version}=await import(location.href);
