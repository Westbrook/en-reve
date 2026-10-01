import ts from "@typescript/typescript6";
import {discoverFrameworkApis} from "./framework-api-discovery.js";
import { getJSDocInfo, resolveMeaningfulParsedTypeFromText, parseCemClassTags, } from "@wc-toolkit/cem-generator-utils";
import { detectClassMembers } from "./api-members.js";
import { detectClassEvents, mergeClassEvents, hasLexicalClassThis } from "./api-events.js";
import { detectCustomElementRegistrations } from "./registrations.js";
import { parseCssMetadata } from "./css-metadata.js";
export function vanillaBuiltin(options = {}) {
    return {
        name: "vanilla",
        shouldAnalyze(sourceText) {
            return sourceText.includes("HTMLElement") || sourceText.includes("customElements.define");
        },
        onFile(context) {
            const fragment = {};
            const tagNamesByClass = detectCustomElementRegistrations(context.sourceFile);
            ts.forEachChild(context.sourceFile, function visit(node) {
                if (ts.isClassDeclaration(node) && node.name && (!options.isClass || options.isClass(node, context))) {
                    const className = node.name.text;
                    const shouldInclude = extendsHTMLElement(node) || tagNamesByClass.has(className);
                    if (!shouldInclude) {
                        ts.forEachChild(node, visit);
                        return;
                    }
                    const jsdoc = getJSDocInfo(node);
                    const classDoc = parseCemClassTags(node);
                    const classFragment = {
                        name: className,
                        exportName: getExportName(node),
                        module: context.filePath,
                        description: jsdoc.description || undefined,
                        summary: classDoc.summary,
                        deprecated: classDoc.deprecated,
                        tagName: classDoc.tagName ?? tagNamesByClass.get(className),
                        superclass: getSuperclassRef(node),
                        attributes: mergeByName(getObservedAttributes(node).map((name) => ({ name })), classDoc.attributes),
                        members: detectClassMembers(node, context),
                        slots: mergeSlots(discoverSlotsFromNode(context.sourceFile, node), classDoc.slots),
                        cssProperties: mergeCssProperties(discoverCssPropertiesFromNode(context.sourceFile, node), classDoc.cssProperties),
                        cssParts: mergeCssParts(discoverCssPartsFromNode(context.sourceFile, node), classDoc.cssParts),
                        cssStates: mergeCssStates(discoverCssStatesFromClass(node), classDoc.cssStates),
                        omitInherited: classDoc.omitInherited,
                        customJsDocTags: classDoc.customJsDocTags,
                        events: mergeClassEvents(detectClassEvents(node, context), classDoc.events?.map((event) => ({
                            ...event,
                            parsedType: context.typeParsing === "none"
                                ? undefined
                                : resolveMeaningfulParsedTypeFromText(event.type, context.sourceFile, context.checker),
                        }))),
                    };
                    for (const attr of classFragment.attributes ?? []) {
                        attr.parsedType =
                            context.typeParsing === "none"
                                ? undefined
                                : resolveMeaningfulParsedTypeFromText(attr.type, context.sourceFile, context.checker);
                    }
                    applyMemberToAttributeLinks(classFragment, classDoc, context);
                    fragment[className] = classFragment;
                }
                ts.forEachChild(node, visit);
            });
            return fragment;
        },
    };
}
function getExportName(node) {
    const modifiers = ts.canHaveModifiers(node) ? ts.getModifiers(node) : undefined;
    if (!modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword))
        return undefined;
    if (modifiers.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword))
        return "default";
    return node.name?.text;
}
function extendsHTMLElement(node) {
    if (!node.heritageClauses)
        return false;
    return node.heritageClauses.some((clause) => clause.types.some((t) => t.expression.getText().match(/HTMLElement$/)));
}
function getSuperclassRef(node) {
    const clause = node.heritageClauses?.find((c) => c.token === ts.SyntaxKind.ExtendsKeyword);
    const heritageType = clause?.types[0];
    const expr = heritageType?.expression.getText();
    if (!expr || expr === "HTMLElement")
        return undefined;
    const className = extractSuperclassName(heritageType?.expression);
    if (!className)
        return { name: expr };
    const module = extractImportModuleForIdentifier(node.getSourceFile(), className);
    return { name: className, module };
}
function extractSuperclassName(expression) {
    if (!expression)
        return undefined;
    if (ts.isIdentifier(expression))
        return expression.text;
    if (ts.isPropertyAccessExpression(expression))
        return expression.name.text;
    return expression.getText();
}
function extractImportModuleForIdentifier(sourceFile, identifier) {
    for (const stmt of sourceFile.statements) {
        if (!ts.isImportDeclaration(stmt))
            continue;
        const module = ts.isStringLiteral(stmt.moduleSpecifier) ? stmt.moduleSpecifier.text : undefined;
        if (!module)
            continue;
        const clause = stmt.importClause;
        if (!clause)
            continue;
        if (clause.name?.text === identifier)
            return module;
        const named = clause.namedBindings;
        if (named &&
            ts.isNamedImports(named) &&
            named.elements.some((el) => el.name.text === identifier)) {
            return module;
        }
    }
    return undefined;
}
function getObservedAttributes(node) {
    for (const member of node.members) {
        const modifiers = ts.canHaveModifiers(member) ? ts.getModifiers(member) : undefined;
        const isObservedAttrs = (ts.isGetAccessorDeclaration(member) || ts.isPropertyDeclaration(member)) &&
            member.name.getText() === "observedAttributes" &&
            modifiers?.some((m) => m.kind === ts.SyntaxKind.StaticKeyword);
        if (!isObservedAttrs)
            continue;
        let arrayLiteral;
        if (ts.isGetAccessorDeclaration(member) && member.body) {
            const returnStmt = member.body.statements.find(ts.isReturnStatement);
            if (returnStmt?.expression && ts.isArrayLiteralExpression(returnStmt.expression)) {
                arrayLiteral = returnStmt.expression;
            }
        }
        else if (ts.isPropertyDeclaration(member) && member.initializer) {
            if (ts.isArrayLiteralExpression(member.initializer)) {
                arrayLiteral = member.initializer;
            }
        }
        if (arrayLiteral) {
            return arrayLiteral.elements.filter(ts.isStringLiteralLike).map((el) => el.text);
        }
    }
    return [];
}
function applyMemberToAttributeLinks(classFragment, classDoc, context) {
    if (!classFragment.members?.length)
        return;
    const byName = new Map(classFragment.members.map((m) => [m.name, m]));
    for (const prop of classDoc.properties ?? []) {
        const existing = byName.get(prop.name);
        if (existing) {
            existing.description = existing.description ?? prop.description;
            existing.type = existing.type ?? prop.type;
            continue;
        }
        classFragment.members.push({
            name: prop.name,
            kind: "field",
            description: prop.description,
            type: prop.type,
        });
    }
    for (const member of classFragment.members) {
        const memberAny = member;
        const attribute = typeof memberAny.attribute === "string" ? memberAny.attribute : undefined;
        if (!attribute)
            continue;
        const attrName = attribute === "" ? normalizeAttributeName(member.name) : attribute;
        const attrs = (classFragment.attributes ??= []);
        let attr = attrs.find((a) => a.name === attrName);
        if (!attr) {
            attr = { name: attrName };
            attrs.push(attr);
        }
        attr.type = attr.type ?? (typeof memberAny.type === "string" ? memberAny.type : undefined);
        attr.parsedType =
            attr.parsedType ??
                (typeof memberAny.parsedType === "string" ? memberAny.parsedType : undefined);
        attr.description = attr.description ?? member.description;
        attr.default =
            attr.default ??
                (typeof memberAny.default === "string" ? memberAny.default : undefined);
        attr.fieldName =
            attr.fieldName ?? member.name;
    }
    for (const attr of classFragment.attributes ?? []) {
        const rec = attr;
        rec.parsedType =
            (typeof rec.parsedType === "string" ? rec.parsedType : undefined) ??
                resolveMeaningfulParsedTypeFromText(typeof rec.type === "string" ? rec.type : undefined, context.sourceFile, context.checker);
    }
}
function normalizeAttributeName(name) {
    return name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
}
function discoverSlotsFromNode(root, ownerClass) {
    const slots = [];
    const seenNames = new Set();
    function visit(n) {
        if ((ts.isClassDeclaration(n) || ts.isClassExpression(n)) && ownerClass && n !== ownerClass) {
            return;
        }
        if (ts.isTemplateExpression(n) || ts.isNoSubstitutionTemplateLiteral(n)) {
            const text = n.getText();
            const tokens = [
                ...text.matchAll(/<slot\b[^>]*>|<!--[\s\S]*?-->|<\/?[a-zA-Z][a-zA-Z0-9-]*[^>]*>/g),
            ]
                .map((m) => ({
                index: m.index,
                value: m[0],
                isSlot: m[0].startsWith("<slot"),
                isComment: m[0].startsWith("<!--"),
            }))
                .sort((a, b) => a.index - b.index);
            let pendingDescription;
            for (const token of tokens) {
                if (token.isSlot) {
                    const fullTag = token.value;
                    const attrs = fullTag.replace(/^<slot\b/, "").replace(/>$/, "");
                    const nameMatch = attrs.match(/\bname="([^"]*)"/i) ?? attrs.match(/\bname='([^']*)'/i);
                    const slotName = nameMatch?.[1] ?? "";
                    if (!seenNames.has(slotName)) {
                        seenNames.add(slotName);
                        slots.push({ name: slotName, description: pendingDescription });
                    }
                    pendingDescription = undefined;
                }
                else if (token.isComment) {
                    pendingDescription =
                        token.value.replace(/^<!--/, "").replace(/-->$/, "").trim() || undefined;
                }
                else {
                    pendingDescription = undefined;
                }
            }
        }
        ts.forEachChild(n, visit);
    }
    ts.forEachChild(root, visit);
    return slots.length ? slots : undefined;
}
function mergeSlots(discovered, jsdoc) {
    if (!discovered && !jsdoc)
        return undefined;
    if (!jsdoc)
        return discovered;
    if (!discovered)
        return jsdoc;
    const byName = new Map(discovered.map((s) => [s.name, { ...s }]));
    for (const slot of jsdoc) {
        byName.set(slot.name, slot);
    }
    return [...byName.values()];
}
function mergeByName(first, second) {
    const merged = new Map();
    for (const item of first ?? [])
        merged.set(item.name, item);
    for (const item of second ?? [])
        merged.set(item.name, item);
    return merged.size ? [...merged.values()] : undefined;
}
function discoverCssPropertiesFromNode(root, ownerClass) {
    const byName = new Map();
    function visit(n) {
        if ((ts.isClassDeclaration(n) || ts.isClassExpression(n)) && ownerClass && n !== ownerClass) {
            return;
        }
        if (ts.isTemplateExpression(n) || ts.isNoSubstitutionTemplateLiteral(n)) {
            for (const property of parseCssMetadata(n.getText()) ?? []) {
                byName.set(property.name, { ...byName.get(property.name), ...property });
            }
        }
        ts.forEachChild(n, visit);
    }
    ts.forEachChild(root, visit);
    return byName.size ? [...byName.values()] : undefined;
}
function mergeCssProperties(discovered, jsdoc) {
    if (!discovered && !jsdoc)
        return undefined;
    if (!jsdoc)
        return discovered;
    if (!discovered)
        return jsdoc;
    const byName = new Map(discovered.map((p) => [p.name, { ...p }]));
    for (const prop of jsdoc) {
        byName.set(prop.name, { ...byName.get(prop.name), ...prop });
    }
    return [...byName.values()];
}
function discoverCssPartsFromNode(root, ownerClass) {
    const byName = new Map();
    function visit(n) {
        if ((ts.isClassDeclaration(n) || ts.isClassExpression(n)) && ownerClass && n !== ownerClass) {
            return;
        }
        if (ts.isTemplateExpression(n) || ts.isNoSubstitutionTemplateLiteral(n)) {
            const text = n.getText();
            const attrMatches = [...text.matchAll(/\bpart\s*=\s*(["'])([^"']+)\1/g)];
            for (const [, , rawValue] of attrMatches) {
                for (const token of rawValue
                    .split(/\s+/)
                    .map((v) => v.trim())
                    .filter(Boolean)) {
                    if (!byName.has(token))
                        byName.set(token, { name: token });
                }
            }
            const commentedParts = [
                ...text.matchAll(/<!--([^<]*?)-->\s*<[^>]*\bpart\s*=\s*(["'])([^"']+)\2[^>]*>/g),
            ];
            for (const [, rawComment, , rawValue] of commentedParts) {
                const description = parseTemplateComment(rawComment);
                if (!description)
                    continue;
                for (const token of rawValue
                    .split(/\s+/)
                    .map((v) => v.trim())
                    .filter(Boolean)) {
                    const existing = byName.get(token);
                    if (!existing)
                        continue;
                    if (!existing.description)
                        existing.description = description;
                }
            }
        }
        ts.forEachChild(n, visit);
    }
    ts.forEachChild(root, visit);
    return byName.size ? [...byName.values()] : undefined;
}
function parseTemplateComment(rawComment) {
    if (!rawComment)
        return undefined;
    const text = rawComment
        .split("\n")
        .map((line) => line.replace(/^\s*\*\s?/, ""))
        .join("\n")
        .trim();
    return text || undefined;
}
function mergeCssParts(discovered, jsdoc) {
    if (!discovered && !jsdoc)
        return undefined;
    if (!jsdoc)
        return discovered;
    if (!discovered)
        return jsdoc;
    const byName = new Map(discovered.map((p) => [p.name, { ...p }]));
    for (const part of jsdoc) {
        byName.set(part.name, { ...byName.get(part.name), ...part });
    }
    return [...byName.values()];
}
function discoverCssStatesFromClass(node, context) {
    const byName = new Map();
    function visit(n) {
        if (ts.isClassDeclaration(n) || ts.isClassExpression(n)) return;
        if (ts.isCallExpression(n) &&
            ts.isPropertyAccessExpression(n.expression) &&
            n.expression.name.text === "add" &&
            ts.isPropertyAccessExpression(n.expression.expression) &&
            n.expression.expression.name.text === "states") {
            if (context?.program) {
                const states = n.expression.expression, internals = states.expression;
                if (!ts.isPropertyAccessExpression(internals) || internals.expression.kind !== ts.SyntaxKind.ThisKeyword || !hasLexicalClassThis(n, node)) return;
                const symbol = context.checker.getSymbolAtLocation(states.name);
                if (!symbol?.declarations?.length || !symbol.declarations.every(declaration => context.program.isSourceFileDefaultLibrary(declaration.getSourceFile()) && ts.isInterfaceDeclaration(declaration.parent) && declaration.parent.name.text === "ElementInternals")) return;
            }
            const arg = n.arguments[0];
            if (arg && ts.isStringLiteralLike(arg) && !byName.has(arg.text)) {
                byName.set(arg.text, { name: arg.text });
            }
        }
        ts.forEachChild(n, visit);
    }
    ts.forEachChild(node, visit);
    return byName.size ? [...byName.values()] : undefined;
}
function mergeCssStates(discovered, jsdoc) {
    if (!discovered && !jsdoc)
        return undefined;
    if (!jsdoc)
        return discovered;
    if (!discovered)
        return jsdoc;
    const byName = new Map(discovered.map((s) => [s.name, { ...s }]));
    for (const state of jsdoc) {
        byName.set(state.name, { ...byName.get(state.name), ...state });
    }
    return [...byName.values()];
}

/** Exact-node extraction only. Caller owns source identity and composition. */
export function extractOwnVanillaClass(node, context) {
const discovered = discoverFrameworkApis(node, context.sourceFile, context.checker);
const jsdoc = getJSDocInfo(node);
const classDoc = parseCemClassTags(node);
const classFragment = {
    name: node.name?.text,
    exportName: getExportName(node),
    module: context.filePath,
    description: jsdoc.description || undefined,
    summary: classDoc.summary,
    deprecated: classDoc.deprecated,
    tagName: classDoc.tagName,
    
    attributes: mergeByName(getObservedAttributes(node).map((name) => ({ name })), classDoc.attributes),
    members: detectClassMembers(node, context),
    slots: mergeSlots(discovered.slots, classDoc.slots),
    cssProperties: mergeCssProperties(discovered.cssProperties, classDoc.cssProperties),
    cssParts: mergeCssParts(discovered.cssParts, classDoc.cssParts),
    cssStates: mergeCssStates(discoverCssStatesFromClass(node, context), classDoc.cssStates),
    omitInherited: classDoc.omitInherited,
    customJsDocTags: classDoc.customJsDocTags,
    events: mergeClassEvents(detectClassEvents(node, context), classDoc.events?.map((event) => ({
        ...event,
        parsedType: context.typeParsing === "none"
            ? undefined
            : resolveMeaningfulParsedTypeFromText(event.type, context.sourceFile, context.checker),
    }))),
};
for (const attr of classFragment.attributes ?? []) {
    attr.parsedType =
        context.typeParsing === "none"
            ? undefined
            : resolveMeaningfulParsedTypeFromText(attr.type, context.sourceFile, context.checker);
}
applyMemberToAttributeLinks(classFragment, classDoc, context);
return classFragment;
}
