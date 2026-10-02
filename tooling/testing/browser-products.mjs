import {readFileSync, realpathSync, statSync} from 'node:fs';
import {isAbsolute, relative, sep} from 'node:path';

/** Explicit opt-in product installations; never discover or alter a user's browser/profile. */
export function browserProductProjects(path = process.env.EN_BROWSER_PRODUCTS) {
  if (!path) return [];
  const manifest = JSON.parse(readFileSync(path, 'utf8'));
  if (manifest.schemaVersion !== 1 || !Array.isArray(manifest.products) || !manifest.products.length)
    throw new Error('Browser product manifest requires schemaVersion 1 and nonempty products');
  const names = new Set();
  return manifest.products.map(product => {
    const {name, product: label, version, executablePath, distributionPath, headless} = product;
    if (!/^product-[a-z0-9-]+$/.test(name) || names.has(name))
      throw new Error('Browser product names must be unique product-* identifiers');
    names.add(name);
    if (typeof label !== 'string' || !label.trim() || !/^\d+\.\d+\.\d+\.\d+$/.test(version) || typeof headless !== 'boolean')
      throw new Error('Browser products require product, observed four-part app version and explicit headless mode');
    const paths = browserProductPaths({executablePath, distributionPath});
    return {
      name,
      metadata: {browserProduct: {product: label, version, ...paths, headless,
        profile: 'Playwright-owned temporary profile; no user profile or remote connection'}},
      use: {browserName: 'chromium', headless, launchOptions: {executablePath: paths.executablePath}},
    };
  });
}

export function browserProductPaths({executablePath, distributionPath}) {
  if (![executablePath, distributionPath].every(value => typeof value === 'string' && isAbsolute(value)))
    throw new Error('Browser product executable and distribution paths must be absolute');
  const executable = realpathSync(executablePath), distribution = realpathSync(distributionPath);
  const child = relative(distribution, executable);
  if (!child || child === '..' || child.startsWith('..' + sep) || isAbsolute(child)
    || !statSync(distribution).isDirectory() || !statSync(executable).isFile())
    throw new Error('Browser executable must be a file inside its attested distribution');
  return {executablePath: executable, distributionPath: distribution};
}
