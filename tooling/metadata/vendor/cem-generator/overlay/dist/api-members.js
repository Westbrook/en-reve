import ts from "@typescript/typescript6";
import { getJSDocInfo, getNodeTypeText, getParsedTypeText, getParsedTypeTextFromType, areTypeTextsEquivalent, parseCemMemberTags, } from "@wc-toolkit/cem-generator-utils";
const memberCache = new WeakMap();
/** Detects public class fields and methods for framework-specific detectors. */
export function detectClassMembers(node, context) {
    const cachedByChecker = memberCache.get(node);
    if (cachedByChecker?.has(context.checker)) {
        return cloneMembers(cachedByChecker.get(context.checker));
    }
    const byName = new Map();
    for (const member of node.members) {
        const modifiers = ts.canHaveModifiers(member) ? ts.getModifiers(member) : undefined;
        const nameText = member.name?.getText();
        if (!nameText || nameText === "observedAttributes")
            continue;
        const privacy = nameText.startsWith("#") ? "private" : getPrivacy(modifiers);
        const jsdoc = getJSDocInfo(member);
        const existing = byName.get(nameText);
        const memberDoc = parseCemMemberTags(member);
        if (memberDoc.internal)
            continue;
        if (ts.isPropertyDeclaration(member) ||
            ts.isGetAccessorDeclaration(member) ||
            ts.isSetAccessorDeclaration(member)) {
            const typeText = getFieldTypeText(member, context.checker);
            const parsedTypeText = shouldParseMember(privacy, isStatic(modifiers), context.typeParsing)
                ? getParsedTypeText(member, context.checker)
                : undefined;
            const metadata = {
                name: nameText,
                kind: "field",
                description: jsdoc.description || existing?.description || undefined,
                summary: memberDoc.summary,
                deprecated: memberDoc.deprecated,
                privacy,
                static: isStatic(modifiers),
                readonly: isReadonly(member),
                type: typeText,
                parsedType: parsedTypeText &&
                    !areTypeTextsEquivalent(parsedTypeText, typeText, { ignoreUndefined: true })
                    ? parsedTypeText
                    : undefined,
                attribute: memberDoc.attribute ??
                    (memberDoc.attributeFromFieldName ? normalizeAttributeName(nameText) : undefined),
                reflects: memberDoc.reflects,
                internal: memberDoc.internal,
                default: memberDoc.default ??
                    (ts.isPropertyDeclaration(member) ? member.initializer?.getText() : undefined),
                customJsDocTags: memberDoc.customJsDocTags,
            };
            // A getter and setter describe one field. Getter facts take priority,
            // and absent setter tags must not erase authored getter documentation.
            if (existing && (ts.isGetAccessorDeclaration(member) || ts.isSetAccessorDeclaration(member))) {
                const primary = ts.isGetAccessorDeclaration(member) ? metadata : existing;
                const secondary = ts.isGetAccessorDeclaration(member) ? existing : metadata;
                byName.set(nameText, {...secondary,
                    ...Object.fromEntries(Object.entries(primary).filter(([, value]) => value !== undefined))});
            } else byName.set(nameText, metadata);
        }
        else if (ts.isMethodDeclaration(member) && !existing) {
            byName.set(nameText, {
                name: nameText,
                kind: "method",
                description: jsdoc.description || undefined,
                summary: memberDoc.summary,
                deprecated: memberDoc.deprecated,
                privacy,
                static: isStatic(modifiers),
                parameters: getMethodParameters(member, context, shouldParseMember(privacy, isStatic(modifiers), context.typeParsing)),
                return: getMethodReturn(member, context, shouldParseMember(privacy, isStatic(modifiers), context.typeParsing)),
                customJsDocTags: memberDoc.customJsDocTags,
            });
        }
    }
    // Only direct constructor assignments are unconditional source defaults.
    // Do not evaluate constructor code or infer defaults from nested branches.
    const constructor = node.members.find(member => ts.isConstructorDeclaration(member) && member.body);
    const parameterProperties = (constructor?.parameters ?? []).filter(parameter => ts.isParameterPropertyDeclaration(parameter, constructor));
    const documentedDefaults = new Map([...node.members, ...parameterProperties].filter(member => member.name)
        .map(member => [member.name.getText(), parseCemMemberTags(member).default])
        .filter(([, value]) => value !== undefined));
    for (const parameter of constructor?.parameters ?? []) {
        if (!ts.isParameterPropertyDeclaration(parameter, constructor)) continue;
        if (!ts.isIdentifier(parameter.name)) throw new Error("Parameter property requires an identifier");
        const name = parameter.name.text, docs = parseCemMemberTags(parameter);
        if (docs.internal) continue;
        if (byName.has(name)) throw new Error("Duplicate own parameter property: " + name);
        const modifiers = ts.getModifiers(parameter), privacy = getPrivacy(modifiers);
        const type = getFieldTypeText(parameter, context.checker);
        const parsed = shouldParseMember(privacy, false, context.typeParsing) ? getParsedTypeText(parameter, context.checker) : undefined;
        byName.set(name, {name, kind: "field", privacy, static: false,
            readonly: !!modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ReadonlyKeyword),
            type, parsedType: parsed && !areTypeTextsEquivalent(parsed, type, {ignoreUndefined: true}) ? parsed : undefined,
            description: getJSDocInfo(parameter).description || undefined,
            summary: docs.summary, deprecated: docs.deprecated,
            attribute: docs.attribute ?? (docs.attributeFromFieldName ? normalizeAttributeName(name) : undefined),
            reflects: docs.reflects, default: docs.default ?? parameter.initializer?.getText(), customJsDocTags: docs.customJsDocTags});
    }
    for (const statement of constructor?.body?.statements ?? []) {
        if (!ts.isExpressionStatement(statement) || !ts.isBinaryExpression(statement.expression)) continue;
        const assignment = statement.expression;
        if (assignment.operatorToken.kind !== ts.SyntaxKind.EqualsToken ||
            !ts.isPropertyAccessExpression(assignment.left) || assignment.left.expression.kind !== ts.SyntaxKind.ThisKeyword) continue;
        const name = assignment.left.name.getText();
        let member = byName.get(name);
        if (!member) {
            const symbol = context.checker.getSymbolAtLocation(assignment.left.name);
            const declaration = symbol?.valueDeclaration ?? symbol?.declarations?.[0];
            if (!declaration || parseCemMemberTags(declaration).internal) continue;
            const modifiers = ts.canHaveModifiers(declaration) ? ts.getModifiers(declaration) : undefined;
            const privacy = name.startsWith("#") ? "private" : getPrivacy(modifiers);
            const type = getNodeTypeText(assignment.left, context.checker);
            const parsedType = shouldParseMember(privacy, false, context.typeParsing) ? getParsedTypeText(assignment.left, context.checker) : undefined;
            member = {name, kind: "field", privacy, type,
                parsedType: parsedType && !areTypeTextsEquivalent(parsedType, type, {ignoreUndefined: true}) ? parsedType : undefined};
            byName.set(name, member);
        }
        if (member.kind === "field") member.default = documentedDefaults.get(name) ?? assignment.right.getText();
    }
    const members = [...byName.values()];
    const checkerCache = cachedByChecker ?? new WeakMap();
    checkerCache.set(context.checker, members);
    memberCache.set(node, checkerCache);
    return cloneMembers(members);
}
function cloneMembers(members) {
    return members?.map((member) => {
        const customJsDocTags = member.customJsDocTags;
        return {
            ...member,
            parameters: member.parameters?.map((parameter) => ({ ...parameter })),
            return: member.return ? { ...member.return } : undefined,
            customJsDocTags: customJsDocTags?.map((tag) => ({ ...tag })),
        };
    });
}
function shouldParseMember(privacy, staticMember, mode) {
    if (mode === "none")
        return false;
    if (mode === "all")
        return true;
    return privacy !== "private" && privacy !== "protected" && !staticMember;
}
function getMethodParameters(method, context, parseTypes) {
    return method.parameters.map((p) => {
        const typeText = getNodeTypeText(p, context.checker);
        const parsedTypeText = parseTypes ? getParsedTypeText(p, context.checker) : undefined;
        return {
            name: p.name.getText(),
            type: typeText,
            parsedType: parsedTypeText &&
                !areTypeTextsEquivalent(parsedTypeText, typeText, { ignoreUndefined: true })
                ? parsedTypeText
                : undefined,
            optional: p.questionToken ? true : undefined,
            rest: p.dotDotDotToken ? true : undefined,
            default: p.initializer ? p.initializer.getText() : undefined,
        };
    });
}
function getMethodReturn(method, context, parseTypes) {
    const signature = context.checker.getSignatureFromDeclaration(method);
    const returnType = signature && context.checker.getReturnTypeOfSignature(signature);
    const type = method.type ? getNodeTypeText(method, context.checker)
        : returnType && context.checker.typeToString(returnType, method, ts.TypeFormatFlags.NoTruncation).trim();
    if (!type)
        return undefined;
    let parsedType;
    try {
        const signature = context.checker.getSignatureFromDeclaration(method);
        const returnType = signature ? context.checker.getReturnTypeOfSignature(signature) : undefined;
        if (returnType) {
            const expanded = parseTypes
                ? getParsedTypeTextFromType(returnType, context.checker, method)
                : undefined;
            const returnTypeText = context.checker.typeToString(returnType, method, ts.TypeFormatFlags.NoTruncation).trim();
            parsedType =
                expanded && !areTypeTextsEquivalent(expanded, returnTypeText, { ignoreUndefined: true })
                    ? expanded
                    : undefined;
        }
    }
    catch {
        parsedType = undefined;
    }
    return { type, parsedType };
}
function isStatic(modifiers) {
    return modifiers?.some((m) => m.kind === ts.SyntaxKind.StaticKeyword) ? true : undefined;
}
function getPrivacy(modifiers) {
    if (!modifiers)
        return "public";
    if (modifiers.some((m) => m.kind === ts.SyntaxKind.PrivateKeyword))
        return "private";
    if (modifiers.some((m) => m.kind === ts.SyntaxKind.ProtectedKeyword))
        return "protected";
    if (modifiers.some((m) => m.kind === ts.SyntaxKind.PublicKeyword))
        return "public";
    return "public";
}
function isReadonly(member) {
    if (ts.isGetAccessorDeclaration(member) || ts.isSetAccessorDeclaration(member)) {
        const paired = member.parent.members.filter(candidate =>
            (ts.isGetAccessorDeclaration(candidate) || ts.isSetAccessorDeclaration(candidate)) &&
            candidate.name.getText() === member.name.getText() &&
            isStatic(ts.getModifiers(candidate)) === isStatic(ts.getModifiers(member)));
        return paired.some(ts.isGetAccessorDeclaration) && !paired.some(ts.isSetAccessorDeclaration) ? true : undefined;
    }
    if (!ts.isPropertyDeclaration(member))
        return undefined;
    const modifiers = ts.canHaveModifiers(member) ? ts.getModifiers(member) : undefined;
    return modifiers?.some((m) => m.kind === ts.SyntaxKind.ReadonlyKeyword) ? true : undefined;
}
function normalizeAttributeName(name) {
    return name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
}

// CEM fields have no independent optional flag. Preserve the authored type and
// represent an optional property's missing value without changing alias names.
function getFieldTypeText(member, checker) {
    const text = getNodeTypeText(member, checker);
    if (!text || !member.type || (!ts.isPropertyDeclaration(member) && !ts.isParameter(member)) || !member.questionToken) return text;
    const annotated = checker.getTypeFromTypeNode(member.type);
    const acceptsUndefined = type => Boolean(type.flags & (ts.TypeFlags.Undefined | ts.TypeFlags.Any | ts.TypeFlags.Unknown)) ||
        Boolean(type.isUnion?.() && type.types.some(acceptsUndefined));
    if (acceptsUndefined(annotated)) return text;
    // Only low-precedence types need wrapping; keep ordinary authored aliases.
    const wrap = ts.isFunctionTypeNode(member.type) || ts.isConstructorTypeNode(member.type) || ts.isConditionalTypeNode(member.type);
    return `${wrap ? `(${text})` : text} | undefined`;
}
