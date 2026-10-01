import {ts} from './compiler-api.mjs';

/** Apply authored Lit visibility before upstream strict export validation. */
export function candidateContractExclusions(manifest: any, sources: any[], sourcePath: (source: any) => string) {
  const contracts = new Map<string, {internal: Set<string>; noAttributes: Set<string>; declared: Set<string>}>();
  const modulePaths = new Map(sources.map(source => [source.fileName, sourcePath(source)]));
  const nameOf = (node: any) => node && (ts.isIdentifier(node) || ts.isStringLiteral(node) || ts.isPrivateIdentifier(node)) ? node.text : undefined;
  for (const source of sources) for (const node of source.statements) {
    if (!ts.isClassDeclaration(node) || !node.name) continue;
    const internal = new Set<string>(), noAttributes = new Set<string>(), declared = new Set<string>();
    for (const member of node.members) {
      const name = nameOf(member.name);
      if (!name) continue;
      if (!(ts.getCombinedModifierFlags(member) & ts.ModifierFlags.Static)) declared.add(name);
      if (ts.getJSDocTags(member).some((tag: any) => tag.tagName.text === 'internal')) {
        internal.add(name); noAttributes.add(name);
      }
      if (name !== 'properties' || !(ts.getCombinedModifierFlags(member) & ts.ModifierFlags.Static)) continue;
      const options = ts.isGetAccessorDeclaration(member)
        ? member.body?.statements.find((statement: any) => ts.isReturnStatement(statement))?.expression : member.initializer;
      if (!options || !ts.isObjectLiteralExpression(options)) continue;
      for (const property of options.properties) {
        const propertyName = nameOf(property.name);
        if (!propertyName || !ts.isPropertyAssignment(property) || !ts.isObjectLiteralExpression(property.initializer)) continue;
        for (const option of property.initializer.properties) {
          if (!ts.isPropertyAssignment(option)) continue;
          if ((nameOf(option.name) === 'state' && option.initializer.kind === ts.SyntaxKind.TrueKeyword)
              || (nameOf(option.name) === 'attribute' && option.initializer.kind === ts.SyntaxKind.FalseKeyword)) noAttributes.add(propertyName);
        }
      }
    }
    contracts.set(sourcePath(source) + '#' + node.name.text, {internal, noAttributes, declared});
  }
  const replaceByDeclaration: Record<string, any> = {};
  for (const module of manifest.modules) for (const declaration of module.declarations ?? []) {
    const key = module.path + '#' + declaration.name, own = contracts.get(key);
    const contractFor = (item: any, field = item.name) => {
      if (own?.declared.has(field)) return own;
      // Lit links inherited attributes to a field but can omit their origin.
      const member = declaration.members?.find((member: any) => member.name === field);
      const reference = item.inheritedFrom ?? member?.inheritedFrom;
      if (!reference) return own;
      const path = reference.module ?? module.path;
      return contracts.get((modulePaths.get(path) ?? path) + '#' + reference.name);
    };
    const internal = (item: any) => contractFor(item)?.internal.has(item.name);
    const excluded = (item: any, field: string) => contractFor(item, field)?.noAttributes.has(field);
    replaceByDeclaration[key] = {
      members: (declaration.members ?? []).map((member: any) => {
        const result = {...member};
        if (internal(member)) result.privacy = 'private';
        if (excluded(member, member.name)) {delete result.attribute; delete result.reflects;}
        return result;
      }),
      attributes: (declaration.attributes ?? []).filter((attribute: any) => !excluded(attribute, attribute.fieldName)),
    };
  }
  return {replaceByDeclaration};
}
