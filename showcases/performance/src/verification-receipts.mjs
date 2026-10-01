export function receiptPaths(args, defaults) {
  if (args.receipt && args.receipts)
    throw new Error("Choose either --receipt or --receipts, not both");
  const paths = args.receipt
    ? [args.receipt]
    : args.receipts
      ? typeof args.receipts === "string" ? args.receipts.split(",") : []
      : defaults;
  if (!Array.isArray(paths) || !paths.length ||
      paths.some((path) => typeof path !== "string" || !path.trim()) ||
      new Set(paths).size !== paths.length)
    throw new Error("Verification receipts require unique, nonempty paths");
  return paths;
}

// Compose evidence in memory; never rewrite an earlier qualification receipt.
export function composeVerificationReceipts(receipts, systems) {
  const projects = new Map();
  for (const { path, data } of receipts) {
    if (!Array.isArray(data.projects))
      throw new Error(`Invalid functional receipt: ${path}`);
    for (const project of data.projects) {
      if (!project.name || typeof project.name !== "string")
        throw new Error(`Unnamed project in functional receipt: ${path}`);
      if (projects.has(project.name))
        throw new Error(`Conflicting functional receipts for ${project.name}: ${projects.get(project.name).path} and ${path}`);
      projects.set(project.name, { path, project });
    }
  }
  const missing = systems.filter(({ id }) => !projects.has(id)).map(({ id }) => id);
  if (missing.length)
    throw new Error(`No functional receipt for ${missing.join(", ")}`);
  const selected = systems.map(({ id }) => projects.get(id).project);
  const sources = receipts.map(({ path, data, sha256 }) => ({
    path,
    sha256,
    verifiedAt: data.verifiedAt,
    systems: systems.filter(({ id }) => projects.get(id).path === path).map(({ id }) => id),
  })).filter((source) => source.systems.length);
  return {
    projects: selected,
    verifiedAt: sources.map((source) => source.verifiedAt).sort().at(-1),
    checksPassed: selected.reduce((count, project) => count + (project.checks || []).filter((check) => check.pass).length, 0),
    sources,
  };
}
