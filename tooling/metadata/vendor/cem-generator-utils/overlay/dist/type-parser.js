import ts from "@typescript/typescript6";
const typeLookupCache = new WeakMap();
const nodeTypeTextCache = new WeakMap();
const parsedTypeTextCache = new WeakMap();
const MAX_EXPANDED_TYPE_LENGTH = 100_000;
/**
 * Shared type extraction helper used by detectors.
 *
 * Priority:
 * 1) Explicit type annotation text
 * 2) TypeChecker inference at node location
 */
export function getNodeTypeText(node, checker) {
    const maybeTyped = node;
    if (maybeTyped.type) {
        const text = normalizeTypeText(maybeTyped.type.getText());
        if (text)
            return text;
    }
    try {
        const cachedByChecker = nodeTypeTextCache.get(node);
        if (cachedByChecker?.has(checker))
            return cachedByChecker.get(checker);
        const type = checker.getTypeAtLocation(node);
        const text = checker.typeToString(type, node, ts.TypeFormatFlags.NoTruncation).trim();
        const result = !text || text === "any" || text === "unknown" ? undefined : text;
        const byChecker = nodeTypeTextCache.get(node) ?? new WeakMap();
        byChecker.set(checker, result);
        nodeTypeTextCache.set(node, byChecker);
        return result;
    }
    catch {
        return undefined;
    }
}
export function normalizeTypeText(text) {
    const compact = text.replace(/\s+/g, " ").replace(/^\s*\|\s*/, "").trim();
    // Compact only when parsing proves literal payloads and type structure
    // survive; newlines may separate members or terminate line comments.
    return areTypeTextsEquivalent(text, compact) ? compact : text.trim();
}
/**
 * Expanded/parsed type text for alias-heavy APIs.
 *
 * Example: `Target | undefined` -> `'a' | 'b' | undefined`
 */
export function getParsedTypeText(node, checker) {
    try {
        const annotation = node.type;
        if (annotation && isOpaqueTypeReference(annotation, checker))
            return undefined;
        const cachedByChecker = parsedTypeTextCache.get(node);
        if (cachedByChecker?.has(checker))
            return cachedByChecker.get(checker);
        const type = checker.getTypeAtLocation(node);
        const expanded = getParsedTypeTextFromType(type, checker, node);
        const result = expanded || undefined;
        const byChecker = parsedTypeTextCache.get(node) ?? new WeakMap();
        byChecker.set(checker, result);
        parsedTypeTextCache.set(node, byChecker);
        return result;
    }
    catch {
        return undefined;
    }
}
function isOpaqueTypeReference(node, checker) {
    if (!ts.isTypeReferenceNode(node))
        return false;
    const symbol = checker.getSymbolAtLocation(node.typeName);
    return (symbol?.declarations?.some((declaration) => {
        const fileName = declaration.getSourceFile().fileName;
        return (declaration.getSourceFile().isDeclarationFile &&
            /[\\/]node_modules[\\/]|[\\/]lib\.[^/\\]+\.d\.ts$/.test(fileName));
    }) ?? false);
}
export function getParsedTypeTextFromType(type, checker, enclosingNode) {
    const state = { visited: new Set(), remaining: MAX_EXPANDED_TYPE_LENGTH, enclosingNode };
    return formatType(type, checker, state, 0);
}
export function areTypeTextsEquivalent(first, second, options = {}) {
    if (!first || !second)
        return false;
    return canonicalizeTypeText(first, options) === canonicalizeTypeText(second, options);
}
function canonicalizeTypeText(text, options) {
    const normalized = stripOuterParentheses(text.trim());
    const union = splitTopLevelOperator(normalized, "|");
    if (union.length > 1) {
        const undefinedKey = canonicalizeTypeText("undefined", {});
        const trueKey = canonicalizeTypeText("true", {});
        const falseKey = canonicalizeTypeText("false", {});
        let parts = union.map((part) => canonicalizeTypeText(part, options))
            .filter((part) => !options.ignoreUndefined || part !== undefinedKey);
        if (parts.includes(trueKey) && parts.includes(falseKey))
            parts = [...parts.filter((part) => part !== trueKey && part !== falseKey), canonicalizeTypeText("boolean", {})];
        parts.sort();
        return parts.length === 1 ? parts[0] : JSON.stringify(["union", parts]);
    }
    const intersection = splitTopLevelOperator(normalized, "&");
    if (intersection.length > 1)
        return JSON.stringify(["intersection", intersection.map((part) => canonicalizeTypeText(part, options)).sort()]);
    // Parser-owned leaf tokens retain template tails and literal whitespace.
    const node = parseTypeText(normalized);
    if (!node)
        return JSON.stringify(["unparsed", normalized]);
    const tokens = [];
    function collect(current) {
        const children = current.getChildren();
        if (children.length) {
            children.forEach(collect);
        } else if (current.kind !== ts.SyntaxKind.SyntaxList) {
            tokens.push([current.kind, ts.isStringLiteral(current) ? current.text : current.getText()]);
        }
    }
    collect(node);
    return JSON.stringify(["type", tokens.filter(([kind], index) => kind !== ts.SyntaxKind.SemicolonToken
        || (index + 1 < tokens.length && tokens[index + 1][0] !== ts.SyntaxKind.CloseBraceToken))]);
}
// Parse complete type syntax so nested return unions, conditional types,
// generic arrows and escaped literals never become top-level operators.
function parseTypeText(text) {
    const source = ts.createSourceFile("__cem_type.ts", `type __CemType = ${text};`, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    const declaration = source.statements[0];
    if (source.parseDiagnostics.length || source.statements.length !== 1 || !declaration || !ts.isTypeAliasDeclaration(declaration))
        return undefined;
    return declaration.type;
}
function stripOuterParentheses(text) {
    let node = parseTypeText(text);
    if (!node)
        return text;
    while (ts.isParenthesizedTypeNode(node))
        node = node.type;
    return node.getText();
}
function splitTopLevelOperator(text, operator) {
    const node = parseTypeText(text);
    if (node && (operator === "|" ? ts.isUnionTypeNode(node) : ts.isIntersectionTypeNode(node)))
        return node.types.map((part) => part.getText());
    return [text];
}
function groupTypeForOperator(text, operator) {
    const node = parseTypeText(text);
    if (!node || ts.isParenthesizedTypeNode(node))
        return text;
    const lowPrecedence = ts.isFunctionTypeNode(node) || ts.isConstructorTypeNode(node) || ts.isConditionalTypeNode(node);
    if (operator === "[]" || lowPrecedence || (operator === "&" && ts.isUnionTypeNode(node)))
        return `(${text})`;
    return text;
}
export function resolveParsedTypeFromText(typeText, sourceFile, checker) {
    if (!typeText)
        return undefined;
    const parts = splitUnion(typeText)
        .map((p) => p.trim())
        .filter(Boolean);
    if (parts.length === 0)
        return undefined;
    const resolved = parts.map((part) => {
        if (isPrimitiveOrLiteral(part))
            return part;
        const node = findTypeNodeWithImports(sourceFile, part, checker);
        if (!node)
            return part;
        try {
            const type = ts.isTypeAliasDeclaration(node)
                ? checker.getTypeFromTypeNode(node.type)
                : checker.getTypeAtLocation(node.name ?? node);
            return getParsedTypeTextFromType(type, checker, sourceFile);
        }
        catch {
            return part;
        }
    });
    return normalizeUnionParts(resolved).map((part) => groupTypeForOperator(part, "|")).join(" | ");
}
export function resolveMeaningfulParsedTypeFromText(typeText, sourceFile, checker) {
    const resolved = resolveParsedTypeFromText(typeText, sourceFile, checker);
    return resolved && !areTypeTextsEquivalent(resolved, typeText, { ignoreUndefined: true })
        ? resolved
        : undefined;
}
function formatType(type, checker, state, depth) {
    if (state.remaining <= 0)
        return "unknown";
    if (depth > 8 || state.visited.has(type)) {
        return safeTypeToString(type, checker, state.enclosingNode);
    }
    state.visited.add(type);
    if (type.isUnion()) {
        const parts = type.types.map((t) => formatType(t, checker, state, depth + 1));
        return normalizeUnionParts(parts).map((part) => groupTypeForOperator(part, "|")).join(" | ");
    }
    if (type.isIntersection()) {
        return type.types.map((t) => groupTypeForOperator(formatType(t, checker, state, depth + 1), "&")).join(" & ");
    }
    // Keep framework/library types opaque, including imported aliases, so
    // declarations from Lit, FAST, Preact, and similar packages are not expanded.
    if ((type.symbol || type.aliasSymbol) && (isOpaqueLibraryType(type) || isClassType(type))) {
        return safeTypeToString(type, checker, state.enclosingNode);
    }
    // The owning compiler preserves readonly, tuple element flags, mapped
    // modifiers, method variance, accessors and quoted/computed property names.
    // Rebuilding properties from names and value types changes those contracts.
    // InTypeAlias expands an outer alias while retaining nested named contracts.
    const text = checker.typeToString(type, state.enclosingNode,
        ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.InTypeAlias);
    return text.length <= MAX_EXPANDED_TYPE_LENGTH ? text : safeTypeToString(type, checker, state.enclosingNode);
}
function safeTypeToString(type, checker, enclosingNode) {
    try {
        const text = checker.typeToString(type, enclosingNode, ts.TypeFormatFlags.NoTruncation);
        return text.length <= MAX_EXPANDED_TYPE_LENGTH ? text : "unknown";
    }
    catch {
        return "unknown";
    }
}
function isOpaqueLibraryType(type) {
    const declarations = [
        ...(type.symbol?.declarations ?? []),
        ...(type.aliasSymbol?.declarations ?? []),
    ];
    return (declarations.some((declaration) => {
        const fileName = declaration.getSourceFile().fileName;
        return (declaration.getSourceFile().isDeclarationFile &&
            (/[\\/]lib\.[^/\\]+\.d\.ts$/.test(fileName) || /[\\/]node_modules[\\/]/.test(fileName)));
    }) ?? false);
}
function isClassType(type) {
    return (type.symbol?.declarations?.some((declaration) => ts.isClassDeclaration(declaration) || ts.isClassExpression(declaration)) ?? false);
}
function normalizeUnionParts(parts) {
    const hasUndefined = parts.includes("undefined");
    const withoutUndefined = parts.filter((p) => p !== "undefined");
    const hasBoolean = withoutUndefined.includes("boolean") || (withoutUndefined.includes("true") && withoutUndefined.includes("false"));
    const other = withoutUndefined.filter((p) => p !== "true" && p !== "false" && p !== "boolean");
    if (hasBoolean && other.length === 0) {
        return hasUndefined ? ["boolean", "undefined"] : ["boolean"];
    }
    const ordered = [...withoutUndefined];
    if (hasUndefined)
        ordered.push("undefined");
    return ordered;
}
function splitUnion(text) {
    return splitTopLevelOperator(text, "|");
}
function findTypeNodeWithImports(sourceFile, name, checker) {
    let lookup = typeLookupCache.get(sourceFile);
    if (!lookup) {
        lookup = buildTypeLookup(sourceFile, checker);
        typeLookupCache.set(sourceFile, lookup);
    }
    return lookup.get(name);
}
function buildTypeLookup(sourceFile, checker) {
    const lookup = new Map();
    const add = (name, node) => {
        if (!lookup.has(name))
            lookup.set(name, node);
    };
    const visit = (node) => {
        if ((ts.isTypeAliasDeclaration(node) ||
            ts.isInterfaceDeclaration(node) ||
            ts.isEnumDeclaration(node) ||
            ts.isClassDeclaration(node)) &&
            node.name) {
            add(node.name.text, node);
        }
        ts.forEachChild(node, visit);
    };
    ts.forEachChild(sourceFile, visit);
    for (const stmt of sourceFile.statements) {
        if (!ts.isImportDeclaration(stmt) || !stmt.importClause)
            continue;
        if (stmt.importClause.name) {
            const resolved = resolveImportSpecifierSymbol(stmt.importClause.name, checker);
            if (resolved)
                add(stmt.importClause.name.text, resolved);
        }
        const bindings = stmt.importClause.namedBindings;
        if (!bindings || !ts.isNamedImports(bindings))
            continue;
        for (const spec of bindings.elements) {
            const resolved = resolveImportSpecifierSymbol(spec.name, checker);
            if (resolved)
                add(spec.name.text, resolved);
        }
    }
    return lookup;
}
function resolveImportSpecifierSymbol(node, checker) {
    const sym = checker.getSymbolAtLocation(node);
    if (!sym)
        return undefined;
    const resolved = (sym.flags & ts.SymbolFlags.Alias) !== 0 ? checker.getAliasedSymbol(sym) : sym;
    const declarations = resolved.getDeclarations() ?? [];
    return declarations.find((decl) => ts.isTypeAliasDeclaration(decl) ||
        ts.isInterfaceDeclaration(decl) ||
        ts.isEnumDeclaration(decl) ||
        ts.isClassDeclaration(decl));
}
function isPrimitiveOrLiteral(text) {
    if ([
        "string",
        "number",
        "boolean",
        "any",
        "unknown",
        "undefined",
        "null",
        "void",
        "never",
        "object",
    ].includes(text)) {
        return true;
    }
    if ((text.startsWith("'") && text.endsWith("'")) ||
        (text.startsWith('"') && text.endsWith('"'))) {
        return true;
    }
    return /^\d+(?:\.\d+)?$/.test(text);
}
