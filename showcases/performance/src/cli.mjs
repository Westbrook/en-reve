import { options } from "./config.mjs";
import { run } from "./runner.mjs";
import { report, latestRun } from "./report.mjs";
import { runLighthouse } from "./lighthouse.mjs";
import { bundleReport } from "./bundles.mjs";
import { check, promote } from "./regression.mjs";
import { functional } from "./functional.mjs";
import { diagnosticReport } from "./diagnostics.mjs";
import { calibrate } from "./calibrate.mjs";
import { exclusiveBrowserWork } from "./lock.mjs";
const args = options(process.argv.slice(2));
async function measured(options) {
  const summary = await exclusiveBrowserWork(async () =>
    report(
      await (options.suite === "lighthouse"
        ? runLighthouse(options)
        : run(options)),
    ),
  );
  if (!summary.complete || summary.failures.length) process.exitCode = 1;
}
switch (args.command) {
  case "registry":
    await exclusiveBrowserWork(async () => (await import("./registry-runner.mjs")).runRegistry(args));
    break;
  case "qualify":
    args.suite = "qualify";
    args.samples ||= "1";
    args.caches ||= "cold";
    await measured(args);
    break;
  case "run":
    await measured(args);
    break;
  case "functional":
    await exclusiveBrowserWork(() => functional(args));
    break;
  case "calibrate":
    await exclusiveBrowserWork(() => calibrate(args));
    break;
  case "diagnostics":
    await diagnosticReport(args.run);
    break;
  case "bundles":
    await bundleReport(args);
    break;
  case "check":
    await check(args);
    break;
  case "promote":
    await promote(args);
    break;
  case "report":
    await report(args.run || (await latestRun()));
    break;
  default:
    console.log(
      "Commands: registry --scenarios activation,scaling,containment,lifecycle,ssr --workflows settings,sso,chat --modes global,scoped --policies shared,group,instance,element --counts 1,4,16; qualify; run --suite load|startup|interactions|memory|diagnostic|bfcache|overhead --samples N --profiles desktop,mobile --caches cold,warm --systems comma-separated-ids --id unique-run-id; report --run id",
    );
}
