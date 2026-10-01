import { root } from "../src/config.mjs";
import { execute as executeScript } from "./execute.mjs";
import { laneCommands } from "./lane-plan.mjs";
const lane = process.argv[2] || "qualification";
if (
  lane !== "qualification" &&
  (!process.env.PERF_BASELINE || !process.env.PERF_INTERACTION_BASELINE)
)
  throw new Error(
    "Set PERF_BASELINE and PERF_INTERACTION_BASELINE before starting a regression lane; baselines never advance automatically",
  );
const execute = (script, args) => executeScript(root, script, args);
const commands = laneCommands(lane);
for (const args of commands) {
  await execute("src/cli.mjs", args);
}
if (lane !== "qualification") {
  if (!process.env.PERF_BASELINE)
    throw new Error(
      "Set PERF_BASELINE to the reviewed immutable anchor before enabling regression lanes",
    );
  await execute("experiments/build-current.mjs", []);
  await execute("src/cli.mjs", ["functional", "--variant", "current-en-reve"]);
  for (const suite of ["load", "interactions"]) {
    const id =
      new Date().toISOString().replace(/[:.]/g, "-") + "-current-" + suite;
    await execute("src/cli.mjs", [
      "run",
      "--suite",
      suite,
      "--systems",
      "en-reve",
      "--variant",
      "current-en-reve",
      "--profiles",
      lane === "sentinel" ? "mobile" : "desktop,mobile",
      "--caches",
      suite === "interactions" || lane === "sentinel" ? "cold" : "cold,warm",
      "--samples",
      "30",
      "--id",
      id,
    ]);
    await execute("src/cli.mjs", [
      "check",
      "--run",
      id,
      "--baseline",
      suite === "load"
        ? process.env.PERF_BASELINE
        : process.env.PERF_INTERACTION_BASELINE,
    ]);
  }
}
