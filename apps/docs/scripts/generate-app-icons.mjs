// Pass an installed sharp module path, or install sharp in the local tool environment.
// Raster assets are checked in; app builds do not require an image-processing library.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
const { default: sharp } = await import(process.argv[2] ? pathToFileURL(process.argv[2]).href : 'sharp');
const root = new URL('../', import.meta.url);
const source = await readFile(new URL('assets/app-icon.svg', root));
await mkdir(new URL('public/icons/', root), { recursive: true });
for (const [path, size] of [['apple-touch-icon.png', 180], ['icons/app-192.png', 192], ['icons/app-512.png', 512], ['icons/app-maskable-512.png', 512]]) {
  await writeFile(new URL(`public/${path}`, root), await sharp(source, { density: 768 }).resize(size, size).png().toBuffer());
}
await writeFile(new URL('public/favicon.png', root), await sharp(await readFile(new URL('public/favicon.svg', root)), { density: 192 }).resize(32, 32).png().toBuffer());
