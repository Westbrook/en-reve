export function laneCommands(lane) {
  const commands = {
    qualification: [["functional"], ["qualify"], ["bundles"]],
    sentinel: [
      ["functional"],
      ["run", "--suite", "load", "--systems", "en-reve,fluent-web-components,radix-react", "--profiles", "mobile", "--caches", "cold", "--samples", "30"],
    ],
    full: [
      ["functional"],
      ["run", "--suite", "load", "--samples", "30"],
      ["run", "--suite", "startup", "--samples", "30"],
      ["run", "--suite", "interactions", "--samples", "30"],
      ["run", "--suite", "diagnostic", "--samples", "1"],
      ["run", "--suite", "memory", "--samples", "5"],
      ["run", "--suite", "lighthouse", "--samples", "5"],
      ["run", "--suite", "bfcache", "--samples", "5"],
      ["run", "--suite", "overhead", "--samples", "5"],
    ],
  }[lane];
  if (!commands) throw new Error("Choose qualification, sentinel or full");
  return commands;
}
