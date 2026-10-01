import { withExecutionOwner } from '../../../tooling/testing/execution-owner.mjs';
import { withMachineOwner } from '../../../tooling/testing/machine-owner.mjs';
import { mkdir, writeFile, readFile, unlink } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { root, json } from "./config.mjs";
export async function exclusiveBrowserWork(work, { environment = process.env,
 workspaceRoot = resolve(root, '../..'),
 browserPath = resolve(environment.EN_GATE_BROWSER_LOCK ?? resolve(root, '.cache/browser-run.lock')) } = {}) {
 return withMachineOwner(() => withExecutionOwner(workspaceRoot,
  () => exclusiveCampaignWork(work, browserPath, environment), { environment }), { environment });
}
async function exclusiveCampaignWork(work, path, environment) {
  path = resolve(path);
  if (environment.EN_GATE_BROWSER_OWNER !== undefined) {
    if (!environment.EN_GATE_BROWSER_LOCK || resolve(environment.EN_GATE_BROWSER_LOCK) !== path)
      throw new Error('Inherited browser lease path is missing or mismatched');
    const claimed = JSON.parse(environment.EN_GATE_BROWSER_OWNER);
    const actual = JSON.parse(await readFile(path, 'utf8'));
    if (typeof claimed?.id !== 'string' || !claimed.id || !Number.isInteger(claimed.pid) || claimed.pid <= 0
        || claimed.id !== actual.id || claimed.pid !== actual.pid)
      throw new Error('Inherited browser lease owner mismatch');
    process.kill(actual.pid, 0);
    return work();
  }
  await mkdir(dirname(path), { recursive: true });
  try {
    await writeFile(
      path,
      json({ pid: process.pid, at: new Date().toISOString() }),
      { flag: "wx" },
    );
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
    const prior = JSON.parse(await readFile(path));
    let alive = true;
    try {
      process.kill(prior.pid, 0);
    } catch (error) {
      if (error.code === "ESRCH") alive = false;
      else throw error;
    }
    if (alive)
      throw new Error(
        `Another browser campaign is active (PID ${prior.pid}). Keep measurements serial.`,
      );
    await unlink(path);
    await writeFile(
      path,
      json({ pid: process.pid, at: new Date().toISOString() }),
      { flag: "wx" },
    );
  }
  try {
    return await work();
  } finally {
    await unlink(path);
  }
}
