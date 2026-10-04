import { spawn } from 'node:child_process';
import { access } from 'node:fs/promises';
import { resolve } from 'node:path';

/** Build the independent reader before documentation deployment hashes are sealed. */
export async function buildPerformanceResults({ workspaceRoot, outputRoot, base }) {
  if (base !== '/en-reve/') return;
  const project = resolve(workspaceRoot, 'showcases/performance-results');
  try {
    await access(resolve(project, 'node_modules/vite/bin/vite.js'));
    await access(resolve(project, 'node_modules/marked/package.json'));
  } catch (cause) {
    throw new Error('Install the independent performance reader first: npm --prefix showcases/performance-results ci --workspaces=false', { cause });
  }
  const env = { ...process.env, PERF_REPORT_BASE: `${base}performance/`, PERF_REPORT_OUTPUT: resolve(outputRoot, 'performance') };
  // Publication always uses the canonical report, never a caller's one-off campaign.
  delete env.PERF_REPORT_SOURCE;
  await new Promise((resolveRun, reject) => {
    const child = spawn('npm', ['run', 'build'], { cwd: project, env, stdio: 'inherit' });
    child.once('error', reject);
    child.once('exit', (code, signal) => code === 0 ? resolveRun() : reject(new Error(`Performance reader build failed (${signal ?? code}).`)));
  });
}
