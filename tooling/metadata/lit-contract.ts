import {createReferenceResolver} from './references.ts';
/** Source-AST corrections for known metadata gaps in the pinned analyzer adapter. */
export interface MetadataCorrection {
  module: string;
  declaration: string;
  member: string;
  reason: string;
}

export function reconcileLitContract(manifest: any, modules: any[], ts: any, accessorType?: (node: any, module: any) => string, sourcePath: (module: any) => string = module => module.fileName, includeClass: (node: any) => boolean = () => true): MetadataCorrection[] {
  const corrections: MetadataCorrection[] = [];
  const contracts = new Map<string, { members: Map<string, any>; noAttributes: Set<string>; internalEvents: Set<string>; outputs: Array<{attribute: string; property: string; description: string}> }>();
  const getName = (node: any): string | undefined => node && (ts.isIdentifier(node) || ts.isStringLiteral(node) || ts.isPrivateIdentifier(node)) ? node.text : undefined;
  for (const module of modules) {
    function visit(node: any): void {
      if ((ts.isClassDeclaration(node) || ts.isClassExpression(node)) && node.name && includeClass(node)) {
        const internalEvents = new Set<string>(ts.getJSDocTags(node).filter((tag: any) => tag.tagName.text === 'internalEvent').map((tag: any) => typeof tag.comment === 'string' ? tag.comment.trim().split(/\s+/)[0] : '').filter(Boolean));
        const outputs = ts.getJSDocTags(node).filter((tag: any) => tag.tagName.text === 'outputAttribute').map((tag: any) => {
          const match = typeof tag.comment === 'string' && /^(\S+)\s+(\S+)\s+-\s+(.+)$/.exec(tag.comment);
          if (!match) throw new Error(`Invalid @outputAttribute in ${sourcePath(module)}`);
          return {attribute: match[1], property: match[2], description: match[3]};
        });
        const members = new Map<string, any>();
        const noAttributes = new Set<string>();
        for (const member of node.members) {
          const name = getName(member.name);
          if (!name) continue;
          const flags = ts.getCombinedModifierFlags(member);
          const isStatic = Boolean(flags & ts.ModifierFlags.Static);
          if (name === 'properties' && isStatic && member.initializer && ts.isObjectLiteralExpression(member.initializer)) {
            for (const property of member.initializer.properties) {
              if (!ts.isPropertyAssignment(property) || !ts.isObjectLiteralExpression(property.initializer)) continue;
              const propertyName = getName(property.name);
              if (!propertyName) continue;
              for (const option of property.initializer.properties) {
                if (!ts.isPropertyAssignment(option)) continue;
                const optionName = getName(option.name);
                if ((optionName === 'state' && option.initializer.kind === ts.SyntaxKind.TrueKeyword) ||
                  (optionName === 'attribute' && option.initializer.kind === ts.SyntaxKind.FalseKeyword)) noAttributes.add(propertyName);
              }
            }
          }
          const internal = ts.getJSDocTags(member).some((tag: any) => tag.tagName.text === 'internal');
          if (isStatic || (!ts.isPropertyDeclaration(member) && !ts.isGetAccessorDeclaration(member) && !ts.isSetAccessorDeclaration(member) && !(internal && ts.isMethodDeclaration(member)))) continue;
          const previous = members.get(name) ?? { getter: false, setter: false };
          let type = ts.isSetAccessorDeclaration(member) ? member.parameters[0]?.type?.getText(module) : member.type?.getText(module);
          const accessor = ts.isGetAccessorDeclaration(member) || ts.isSetAccessorDeclaration(member);
          if (accessor && accessorType) {
            type = accessorType(member, module);
            if (ts.isSetAccessorDeclaration(member) && previous.getter) type = previous.type;
          }
          members.set(name, {
            ...previous,
            ...(accessor && type ? {accessorType: type} : {}),
            internal: previous.internal || internal,
            privacy: ts.isPrivateIdentifier(member.name) || (flags & ts.ModifierFlags.Private) ? 'private'
              : flags & ts.ModifierFlags.Protected ? 'protected' : 'public',
            ...(type ? { type } : {}),
            getter: previous.getter || ts.isGetAccessorDeclaration(member),
            setter: previous.setter || ts.isSetAccessorDeclaration(member),
            readonly: Boolean(flags & ts.ModifierFlags.Readonly),
          });
        }
        contracts.set(`${sourcePath(module)}#${node.name.text}`, { members, noAttributes, internalEvents, outputs });
      }
      ts.forEachChild(node, visit);
    }
    visit(module);
  }

  const resolveReference = createReferenceResolver(manifest);
  function sourceReference(reference: any, from = ''): string | undefined {
    const resolved = resolveReference(reference, from);
    return resolved ? `${resolved.modulePath}#${resolved.declaration.name}` : undefined;
  }

  for (const module of manifest.modules) {
    for (const declaration of module.declarations ?? []) {
      const own = contracts.get(`${module.path}#${declaration.name}`);
      const noAttributes = new Set(own?.noAttributes ?? []);
      for (const event of declaration.events ?? []) {
        const inherited = sourceReference(event.inheritedFrom, module.path);
        const source = inherited ? contracts.get(inherited) : own;
        if (own?.internalEvents.has(event.name) || source?.internalEvents.has(event.name)) {
          event.privacy = 'private';
          corrections.push({ module: module.path, declaration: declaration.name, member: event.name, reason: 'Excluded source-annotated @internalEvent coordination from the public event contract.' });
        }
      }
      for (const member of declaration.members ?? []) {
        const inherited = sourceReference(member.inheritedFrom, module.path);
        if (inherited && contracts.get(inherited)?.noAttributes.has(member.name)) noAttributes.add(member.name);
        const source = own?.members.get(member.name);
        const contract = source ?? (inherited ? contracts.get(inherited)?.members.get(member.name) : undefined);
        if (contract?.internal) {
          member.privacy = 'private';
          noAttributes.add(member.name);
          corrections.push({ module: module.path, declaration: declaration.name, member: member.name, reason: 'Excluded source-annotated @internal coordination from the public API contract.' });
        }
        if (contract?.accessorType) {
          if (member.type?.text !== contract.accessorType) corrections.push({module: module.path, declaration: declaration.name, member: member.name, reason: 'Normalized getter/setter type from the source checker.'});
          member.type = {text: contract.accessorType};
          for (const attribute of declaration.attributes ?? []) if (attribute.fieldName === member.name) attribute.type = {text: contract.accessorType};
        }
        if (!source || !member.inheritedFrom) continue;
        // The analyzer must not replace a concrete override with its base's visibility/type/accessor flags.
        member.privacy = source.internal ? 'private' : source.privacy;
        if (source.type) member.type = { text: source.type };
        if ((source.getter && !source.setter) || source.readonly) member.readonly = true;
        else delete member.readonly;
        delete member.inheritedFrom;
        corrections.push({ module: module.path, declaration: declaration.name, member: member.name, reason: 'Preserved the concrete source override instead of inherited visibility/type/accessor flags.' });
      }
      if (noAttributes.size) {
        declaration.attributes = (declaration.attributes ?? []).filter((attribute: any) => {
          if (!noAttributes.has(attribute.fieldName)) return true;
          corrections.push({ module: module.path, declaration: declaration.name, member: attribute.fieldName, reason: 'Removed an analyzer attribute for an explicit Lit state:true or attribute:false property.' });
          return false;
        });
        for (const member of declaration.members ?? []) if (noAttributes.has(member.name)) { delete member.attribute; delete member.reflects; }
      }
      for (const output of own?.outputs ?? []) {
        const member = declaration.members?.find((item: any) => item.name === output.property);
        const contract = own?.members.get(output.property);
        if (!member || !contract?.getter || contract.setter) throw new Error(`Output attribute requires a read-only getter: ${module.path}#${output.property}`);
        member.attribute = output.attribute; member.reflects = true; member.readonly = true;
        declaration.attributes ??= [];
        const existing = declaration.attributes.find((item: any) => item.name === output.attribute);
        if (existing) {
          if (existing.fieldName !== output.property || existing.type?.text !== member.type?.text || (existing.description !== undefined && existing.description !== output.description)) throw new Error(`Conflicting output attribute: ${output.attribute}`);
          existing.description = output.description;
        } else declaration.attributes.push({name: output.attribute,fieldName:output.property,type:member.type,description:output.description});
        corrections.push({module:module.path,declaration:declaration.name,member:output.property,reason:'Preserved explicitly authored one-way output attribute; no writable Lit attribute was added.'});
      }
      const references = [declaration.superclass, ...(declaration.mixins ?? []), ...(declaration.members ?? []).map((member: any) => member.inheritedFrom), ...(declaration.attributes ?? []).map((attribute: any) => attribute.inheritedFrom)];
      for (const reference of references) {
        const resolved = sourceReference(reference, module.path);
        if (resolved && reference.module !== resolved.slice(0, resolved.lastIndexOf('#'))) {
          reference.module = resolved.slice(0, resolved.lastIndexOf('#'));
          corrections.push({ module: module.path, declaration: declaration.name, member: reference.name, reason: 'Resolved the source-backed local declaration reference to an emitted CEM module.' });
        }
      }
    }
  }
  return corrections;
}
