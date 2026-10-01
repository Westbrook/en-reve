import {ts} from './compiler-api.mjs';

// Parse source policy before extraction. This never evaluates an options object;
// the caller proves installed Lit identity before enabling reactive semantics.
export function constructorOriginPolicies(node: any, litOwned: boolean) {
  const internal = new Set<string>(), noAttributes = new Set<string>();
  const internalEvents = new Set<string>(), reactive = new Map<string, any>();
  const nameOf = (name: any) => {
    if (!name || !(ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isPrivateIdentifier(name))) return undefined;
    const spelling = name.getText();
    // The copied extractor uses source spelling. Reject escaped keys before it
    // can disagree with decoded semantic identity; plain quoted keys are exact.
    if ((ts.isStringLiteral(name) ? spelling.slice(1, -1) : spelling) !== name.text) return undefined;
    return name.text;
  };
  const dynamic = () => {throw new Error('Dynamic reactive policies require an occurrence adapter');};
  const ownMembers = [...node.members];
  for (const member of node.members) if (ts.isConstructorDeclaration(member) && member.body) {
    ownMembers.push(...member.parameters.filter((p: any) => ts.isParameterPropertyDeclaration(p, member)));
  }
  for (const member of ownMembers) {
    const name = nameOf(member.name); if (!name) continue;
    const isStatic = Boolean(ts.getCombinedModifierFlags(member) & ts.ModifierFlags.Static);
    if (ts.getJSDocTags(member).some((tag: any) => ['internal', 'ignore'].includes(tag.tagName.text))) {
      internal.add(JSON.stringify([isStatic, name]));
      if (!isStatic) noAttributes.add(name);
    }
    if (!litOwned || name !== 'properties' || !isStatic) continue;
    let options = member.initializer;
    if (ts.isGetAccessorDeclaration(member)) {
      const statements = member.body?.statements;
      if (statements?.length !== 1 || !ts.isReturnStatement(statements[0])) dynamic();
      options = statements[0].expression;
    }
    if (!options || !ts.isObjectLiteralExpression(options)) dynamic();
    for (const property of options.properties) {
      const field = nameOf(property.name);
      if (!field || !ts.isPropertyAssignment(property) || !ts.isObjectLiteralExpression(property.initializer) || reactive.has(field)) dynamic();
      const optionNodes = new Map<string, any>();
      let attribute: string | boolean = true, reflect = false, state = false;
      for (const option of property.initializer.properties) {
        const key = nameOf(option.name);
        if (!key || !ts.isPropertyAssignment(option) || optionNodes.has(key)) dynamic();
        optionNodes.set(key, option);
        if (['state', 'reflect', 'attribute'].includes(key)) {
          const value = option.initializer;
          if (value.kind !== ts.SyntaxKind.TrueKeyword && value.kind !== ts.SyntaxKind.FalseKeyword && !(key === 'attribute' && ts.isStringLiteral(value))) dynamic();
          const literal = ts.isStringLiteral(value) ? value.text : value.kind === ts.SyntaxKind.TrueKeyword;
          if (key === 'attribute') attribute = literal;
          else if (key === 'reflect') reflect = literal as boolean;
          else state = literal as boolean;
        }
      }
      // Lit replaces each property's complete options object; omitted settings
      // reset to their defaults rather than inheriting a previous alias/reflect.
      const attributeName = state || attribute === false ? undefined : typeof attribute === 'string' ? attribute : field.toLowerCase();
      if (attributeName === undefined) noAttributes.add(field);
      reactive.set(field, Object.freeze({property, optionNodes, attribute: attributeName, reflect, state}));
    }
  }
  for (const tag of ts.getJSDocTags(node)) if (tag.tagName.text === 'internalEvent') {
    if (typeof tag.comment !== 'string' || !tag.comment.trim()) throw new Error('Internal event requires a name');
    internalEvents.add(tag.comment.trim().split(/\s+/)[0]);
  }
  return {internal, noAttributes, internalEvents, reactive};
}
