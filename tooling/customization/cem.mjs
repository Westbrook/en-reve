/** Add contract metadata only to actually authored CEM CSS-property entries.
 * Co-declared Parts remain component context, not a claimed hook-to-Part map. */
export function decorateCustomizationMetadata(manifest, contracts) {
  const byName = new Map(contracts.map(contract => [contract.cssName, contract]));
  for (const module of manifest.modules) for (const declaration of module.declarations ?? []) {
    if (!declaration.tagName) continue;
    for (const property of declaration.cssProperties ?? []) {
      const contract = byName.get(property.name);
      if (!contract) continue;
      property['x-en-reve-customization'] = {
        kind: contract.kind, family: contract.family, reset: contract.reset,
        tokenId: contract.tokenId ?? null, managed: contract.managed,
        consumerStatus: contract.consumerStatus ?? 'source-referenced',
      };
    }
  }
  return manifest;
}

export function cemAssociations(manifest) {
  return manifest.modules.flatMap(module => (module.declarations ?? []).filter(declaration => declaration.tagName).flatMap(declaration =>
    (declaration.cssProperties ?? []).map(property => ({
      cssName: property.name, tagName: declaration.tagName, source: `packages/elements/${module.path}`,
      description: property.description ?? '', contract: property['x-en-reve-customization'] ?? null,
      partsAvailableOnComponent: (declaration.cssParts ?? []).map(part => ({ name: part.name, description: part.description ?? '' })),
      partRelationship: 'co-declared-only; no hook-to-Part mapping inferred',
    }))));
}
