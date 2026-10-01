import {ts} from './compiler-api.mjs';
import {parseCemClassTags} from '@wc-toolkit/cem-generator-utils';
import {constructorOriginPolicies} from './candidate-constructor-policies.ts';

export const constructorFacets = ['members', 'attributes', 'events', 'slots', 'cssParts', 'cssProperties', 'cssStates'] as const;
type Facet = typeof constructorFacets[number];
const documentation = ['description', 'summary', 'deprecated'];
const clone = (value: any) => structuredClone(value);
function freezeJson(value: any): any {
  if (value && typeof value === 'object') {for (const child of Object.values(value)) freezeJson(child); Object.freeze(value);}
  return value;
}
function keyOf(facet: Facet, row: any, step: any) {
  if (!row || typeof row !== 'object' || typeof row.name !== 'string' || (!row.name && facet !== 'slots')) throw new Error('Unnamed constructor facet: ' + facet);
  if (facet === 'members') {
    if (!['field', 'method'].includes(row.kind) || (row.static !== undefined && typeof row.static !== 'boolean')) throw new Error('Unsupported member identity');
    // Fields and methods occupy one property slot. Static and instance sides do not.
    return row.name.startsWith('#') ? JSON.stringify(['private', step.index, Boolean(row.static), row.name]) : JSON.stringify([Boolean(row.static), row.name]);
  }
  return row.name;
}

/** Compose source-bound contracts, preserving semantic types in a sidecar.
 * This returns internal composition records, NOT a serialized CEM. Metadata
 * type strings remain authored templates until the consuming serializer uses
 * each record's semantic member or exact occurrence context. No copied text is
 * claimed to be an instantiated event/attribute type. The default guard stays.
 */
export function constructorContractComposition(program: any, sources: any[], extraction: any) {
  sources = [...sources];
  const checker = program.getTypeChecker(), index = extraction.index;
  const rows = new Map<any, any>(), results = new Map<any, any>();
  const provenance = new WeakMap<object, any>();
  const check = () => {
    extraction.bindings.assertProgram(program, sources);
    extraction.validate(); // Including shadowed source contracts and hidden payloads.
  };
  check();
  for (const module of extraction.internal.modules) for (const row of module.declarations) {
    if (!['class', 'mixin'].includes(row.kind) || extraction.bindings.isPassthroughDeclaration?.(row)) continue;
    extraction.bindings.assertDeclaration(module.path, row);
    const origin = index.originOf(row);
    if (rows.has(origin)) throw new Error('Duplicate bound constructor row');
    rows.set(origin, row);
  }
  function supplement(origin: any, row: any, policy: any) {
    if (row.kind !== 'field' || row.static || row.name.startsWith('#')) return undefined;
    const node = origin.node;
    const constructors = node.members.filter((member: any) => ts.isConstructorDeclaration(member) && member.body);
    const declared = [...node.members, ...constructors.flatMap((ctor: any) => ctor.parameters.filter((p: any) => ts.isParameterPropertyDeclaration(p, ctor)))];
    if (declared.some((member: any) => member.name?.text === row.name && !(ts.getCombinedModifierFlags(member) & ts.ModifierFlags.Static))) return undefined;
    let assignment;
    for (const statement of constructors[0]?.body.statements ?? []) {
      const expression = ts.isExpressionStatement(statement) && statement.expression;
      if (expression && ts.isBinaryExpression(expression) && expression.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
          ts.isPropertyAccessExpression(expression.left) && expression.left.expression.kind === ts.SyntaxKind.ThisKeyword && expression.left.name.text === row.name) assignment = expression;
    }
    const reactive = policy.reactive.get(row.name);
    if (!assignment && !reactive) return undefined;
    if (assignment && row.default !== assignment.right.getText()) throw new Error('Constructor default does not match its direct assignment');
    const symbols = assignment ? checker.getSymbolAtLocation(assignment.left.name)?.declarations : undefined;
    if (assignment && !symbols?.length) throw new Error('Constructor default has no bound property');
    return Object.freeze({origin, assignment, reactive, declarations: symbols && Object.freeze([...symbols])});
  }
  function compose(root: any) {
    check();
    const steps = index.compositionFor(root); // Reject foreign or unselected roots before caching.
    if (results.has(root)) return results.get(root);
    const rootOrigin = index.originFor(root);
    const state = new Map<Facet, Map<string, any>>(constructorFacets.map(facet => [facet, new Map()]));
    const exclusions: any[] = [], omissions: any[] = [];
    for (const step of steps) {
      if (!step.origin) continue; // Opaque terminal remains in the explicit steps; invent no contracts.
      const origin = step.origin, own = rows.get(origin);
      if (!own || index.originOf(own) !== origin) throw new Error('Composition origin has no exact own row');
      const omit = own.omitInherited ?? {};
      if (!omit || typeof omit !== 'object' || Array.isArray(omit) || Object.keys(omit).some(key => !constructorFacets.includes(key as Facet))) throw new Error('Unsupported inherited facet omission');
      const policy = constructorOriginPolicies(origin.node, extraction.bindings.isLitOrigin(origin));
      const inheritedAttributes = [...state.get('attributes')!.values()];
      const authoredAttributes = new Map((parseCemClassTags(origin.node).attributes ?? []).map((row: any) => [row.name, row]));
      for (const facet of constructorFacets) {
        const omitted = omit[facet] ?? [];
        if (!Array.isArray(omitted) || omitted.some((name: any) => typeof name !== 'string' || !name.trim())) throw new Error('Invalid inherited facet omission');
        const names = new Set(omitted.map((name: string) => name.trim())), current = state.get(facet)!;
        if (names.size) omissions.push(Object.freeze({facet, names: Object.freeze([...names]), by: step}));
        for (const [key, record] of current) {
          const hiddenMember = facet === 'members' && policy.internal.has(key);
          const hiddenAttribute = facet === 'attributes' && (policy.noAttributes.has(record.metadata.fieldName) || policy.reactive.has(record.metadata.fieldName));
          if (names.has(record.metadata.name) || hiddenMember || hiddenAttribute) {
            current.delete(key); exclusions.push(Object.freeze({facet, key, source: record.step, by: step,
              reason: names.has(record.metadata.name) ? 'authored-omission' : hiddenMember ? 'internal-member' : 'non-attribute-field'}));
          }
        }
        const local = own[facet] ?? [];
        if (!Array.isArray(local)) throw new Error('Invalid own facet rows: ' + facet);
        const seen = new Set<string>();
        for (const row of local) {
          const key = keyOf(facet, row, step);
          if (seen.has(key)) throw new Error('Duplicate own constructor facet: ' + facet + '#' + key);
          seen.add(key);
          if (row.inheritedFrom) throw new Error('Own extractor returned an already inherited facet');
          let metadata = clone(row);
          const previous = current.get(key), contribution = facet === 'members' ? supplement(origin, row, policy) : undefined;
          if (contribution) {
            if (!previous || previous.metadata.kind !== 'field') throw new Error('Supplemental member requires its composed source field');
            metadata = clone(previous.metadata);
            if (contribution.assignment) metadata.default = row.default;
            if (contribution.reactive) {
              if (row.attribute === undefined) delete metadata.attribute; else metadata.attribute = row.attribute;
              if (contribution.reactive.reflect) metadata.reflects = true; else delete metadata.reflects;
            }
          }
          if (previous && !names.has(row.name) && (facet !== 'members' || previous.metadata.kind === row.kind)) {
            for (const field of documentation) if (metadata[field] === undefined && previous.metadata[field] !== undefined) metadata[field] = clone(previous.metadata[field]);
          }
          // An own documentation row may omit the generated field link. Keep
          // only the same-name surviving inherited link to a composed field;
          // final semantic ownership below must agree with that field record.
          let inheritedLink;
          if (facet === 'attributes' && metadata.fieldName === undefined && typeof previous?.metadata.fieldName === 'string' && !names.has(row.name)) {
            const fieldName = previous.metadata.fieldName;
            const field = state.get('members')!.get(JSON.stringify([false, fieldName]));
            if (field?.metadata.kind === 'field' && !policy.noAttributes.has(fieldName)) {
              metadata.fieldName = fieldName;
              inheritedLink = Object.freeze({kind:'inherited-attribute-link', fieldName, source:previous.step, by:step});
            }
          }
          let declaringOrigin = contribution ? previous.origin : origin, declaringStep = contribution ? previous.step : step;
          let contributions = contribution ? [...previous.contributions, Object.freeze({...contribution, by: step})] : [];
          if (inheritedLink) contributions.push(inheritedLink);
          let appliedPolicies = contribution ? [...previous.policies] : [];
          let attributeDefaultAuthored = facet === 'attributes' && (authoredAttributes.get(row.name) as any)?.default !== undefined;
          let attributeTypeContract = facet === 'attributes' ? Object.freeze((authoredAttributes.get(row.name) as any)?.type !== undefined
            ? {kind:'authored', origin, name:row.name, type:(authoredAttributes.get(row.name) as any).type}
            : {kind:'generated', fieldName:metadata.fieldName}) : undefined;
          let attributeDefaultContract = facet === 'attributes' ? Object.freeze(attributeDefaultAuthored
            ? {kind:'authored', origin, name:row.name, default:(authoredAttributes.get(row.name) as any).default}
            : {kind:'generated', fieldName:metadata.fieldName}) : undefined;
          if (inheritedLink) {
            const authored = authoredAttributes.get(row.name) as any;
            if (authored?.type === undefined) {
              if (previous.metadata.type === undefined) delete metadata.type; else metadata.type = clone(previous.metadata.type);
              if (previous.metadata.parsedType === undefined) delete metadata.parsedType; else metadata.parsedType = clone(previous.metadata.parsedType);
              attributeTypeContract = previous.attributeTypeContract;
            }
            if (authored?.default === undefined) {
              if (previous.metadata.default === undefined) delete metadata.default; else metadata.default = clone(previous.metadata.default);
              attributeDefaultAuthored = previous.attributeDefaultAuthored;
              attributeDefaultContract = previous.attributeDefaultContract;
            }
            contributions = [...previous.contributions, inheritedLink];
          }
          if (facet === 'members' && row.kind === 'field' && previous?.metadata.kind === 'field' && row.default === undefined) {
            const declared = origin.node.members.find((node: any) => ts.isPropertyDeclaration(node) && node.name?.text === row.name &&
              Boolean(ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Static) === Boolean(row.static) &&
              node.modifiers?.some((modifier: any) => modifier.kind === ts.SyntaxKind.DeclareKeyword) && !node.initializer);
            if (declared && previous.metadata.default !== undefined) {
              metadata.default = previous.metadata.default;
              contributions.push(Object.freeze({kind: 'declare-only-default', declaration: declared, source: previous.step, by: step}));
            }
          }
          if (facet === 'attributes' && typeof metadata.fieldName === 'string') {
            const fieldName = metadata.fieldName;
            const field = state.get('members')!.get(JSON.stringify([false, fieldName]));
            // A direct constructor assignment supplements the inherited field
            // without replacing its independently authored attribute contract.
            const configuring = field?.contributions.findLast((item: any) => item.by === step && (item.reactive || item.assignment));
            if (configuring) {
              if (previous && previous.metadata.fieldName !== fieldName) throw new Error('Reactive attribute collision: ' + row.name);
              const candidates = inheritedAttributes.filter((item: any) => item.metadata.fieldName === fieldName && !names.has(item.metadata.name));
              const prior = candidates.find((item: any) => item.metadata.name === row.name) ?? (candidates.length === 1 ? candidates[0] : undefined);
              if (!prior && candidates.length > 1) throw new Error('Reactive attribute remapping has ambiguous source contracts');
              const authored = authoredAttributes.get(row.name) as any;
              metadata = {...clone(prior?.metadata ?? {}), name: row.name, fieldName};
              if (authored?.type !== undefined) {
                metadata.type = row.type;
                if (row.parsedType === undefined) delete metadata.parsedType; else metadata.parsedType = clone(row.parsedType);
              } else if (metadata.type === undefined) {
                metadata.type = field.metadata.type;
                if (field.metadata.parsedType === undefined) delete metadata.parsedType; else metadata.parsedType = clone(field.metadata.parsedType);
              }
              for (const key of [...documentation, 'default']) {
                if (authored?.[key] !== undefined) metadata[key] = clone(authored[key]);
                else if (metadata[key] === undefined && field.metadata[key] !== undefined) metadata[key] = clone(field.metadata[key]);
              }
              attributeDefaultAuthored = authored?.default !== undefined || Boolean(prior?.attributeDefaultAuthored);
              if (authored?.type === undefined && prior?.attributeTypeContract) attributeTypeContract = prior.attributeTypeContract;
              if (authored?.default === undefined && prior?.attributeDefaultContract) attributeDefaultContract = prior.attributeDefaultContract;
              if (configuring.assignment && !attributeDefaultAuthored) metadata.default = field.metadata.default;
              declaringOrigin = authored ? origin : prior?.origin ?? field.origin;
              declaringStep = authored ? step : prior?.step ?? field.step;
              contributions = [...(prior?.contributions ?? []), ...(inheritedLink ? [inheritedLink] : []), configuring];
              appliedPolicies = [...(prior?.policies ?? [])];
            }
          }
          if (declaringOrigin !== rootOrigin) metadata.inheritedFrom = {...declaringOrigin.reference};
          else delete metadata.inheritedFrom;
          // Reinsert winners in composition order, retaining their exact application occurrence.
          current.delete(key); current.set(key, {facet, key, metadata, origin: declaringOrigin, step: declaringStep,
            contributions, policies: appliedPolicies, attributeDefaultAuthored, attributeTypeContract, attributeDefaultContract});
        }
      }
      // Constructor writes and erased declare-only fields retain exact default
      // contributions. Update generated links without replacing authored defaults.
      for (const [key, record] of state.get('attributes')!) {
        if (record.attributeDefaultAuthored || typeof record.metadata.fieldName !== 'string') continue;
        const field = state.get('members')!.get(JSON.stringify([false, record.metadata.fieldName]));
        const change = field?.contributions.findLast((item: any) => item.by === step && (item.assignment || item.kind === 'declare-only-default'));
        if (change && field.metadata.default !== undefined) state.get('attributes')!.set(key, {...record,
          metadata: {...record.metadata, default: field.metadata.default},
          contributions: record.contributions.includes(change) ? record.contributions : [...record.contributions, change]});
      }
      // State/attribute:false declarations can affect an inherited field without redeclaring it.
      for (const [key, record] of state.get('members')!) if (!record.metadata.static && policy.noAttributes.has(record.metadata.name)) {
        const metadata = clone(record.metadata); delete metadata.attribute; delete metadata.reflects;
        state.get('members')!.set(key, {...record, metadata, policies: [...record.policies, Object.freeze({kind: 'non-attribute-field', by: step})]});
      }
      for (const [key, record] of state.get('events')!) if (policy.internalEvents.has(record.metadata.name)) {
        state.get('events')!.set(key, {...record, metadata: {...record.metadata, privacy: 'private'}, policies: [...record.policies, Object.freeze({kind: 'internal-event', by: step})]});
      }
    }
    const facets: any = {};
    for (const facet of constructorFacets) facets[facet] = Object.freeze([...state.get(facet)!.values()].map(record => {
      let semanticMember;
      if (facet === 'members' && record.metadata.name.startsWith('#')) {
        if (record.metadata.privacy !== 'private') throw new Error('Private identifier lost its privacy contract');
        // Private identifiers have compiler-internal symbol keys and cannot be
        // named through the public instance property API. Retain their exact
        // source context; do not pretend their template type was instantiated.
      } else if (facet === 'members') {
        semanticMember = index.effectiveMember(root, record.metadata.name, Boolean(record.metadata.static));
        if (semanticMember.origin !== record.origin || semanticMember.step !== record.step) throw new Error('Composed member disagrees with semantic source winner: ' + record.metadata.name);
        for (const contribution of record.contributions) if (contribution.declarations &&
            !contribution.declarations.every((node: any) => semanticMember.declarations.includes(node))) throw new Error('Constructor supplement targets a different semantic member');
      } else if (facet === 'attributes' && typeof record.metadata.fieldName === 'string') {
        semanticMember = index.effectiveMember(root, record.metadata.fieldName);
        // A visible attribute cannot resurrect a field excluded from the composed contract.
        const field = state.get('members')!.get(JSON.stringify([false, record.metadata.fieldName]));
        if (!field || field.metadata.kind !== 'field') throw new Error('Attribute points to a missing composed field');
        if (semanticMember.origin !== field.origin || semanticMember.step !== field.step) throw new Error('Attribute link disagrees with semantic field ownership');
      }
      const bound = Object.freeze({facet, key: record.key, metadata: freezeJson(record.metadata)});
      provenance.set(bound, Object.freeze({root, origin: record.origin, step: record.step,
        contexts: record.step.contexts, semanticMember, attributeTypeContract: record.attributeTypeContract, attributeDefaultContract: record.attributeDefaultContract, contributions: Object.freeze(record.contributions), policies: Object.freeze(record.policies)}));
      return bound;
    }));
    const result = Object.freeze({root, steps, facets: Object.freeze(facets), exclusions: Object.freeze(exclusions), omissions: Object.freeze(omissions),
      scope: 'source-bound seven-facet composition; serialization/instantiated event and attribute annotations are separate', qualified: false});
    results.set(root, result); return result;
  }
  function provenanceOf(record: any) {
    check();const bound = provenance.get(record);
    if (!bound) throw new Error('Facet has no exact composition provenance');
    return bound;
  }
  return Object.freeze({compose, provenanceOf, checker});
}
