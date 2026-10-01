import { spawn } from "node:child_process";
import { resolve } from "node:path";

export async function execute(root, script, args, launch = spawn) {
  const scriptPath = resolve(root, script);
  const code = await new Promise((complete, reject) => {
    const child = launch(process.execPath, [scriptPath, ...args], {
      stdio: "inherit",
    });
    child.on("error", reject);
    child.on("exit", complete);
  });
  if (code !== 0)
    throw new Error(`${script} failed (${code}); evidence retained`);
}
