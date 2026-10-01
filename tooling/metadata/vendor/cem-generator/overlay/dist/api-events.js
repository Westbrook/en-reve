import ts from "@typescript/typescript6";
import { getNodeTypeText } from "@wc-toolkit/cem-generator-utils";
/** Detects statically named platform events dispatched by a component. */
export function detectClassEvents(node, context) {
    const byName = new Map();
    function visit(current) {
        if (ts.isClassDeclaration(current) || ts.isClassExpression(current))
            return;
        if (ts.isCallExpression(current) &&
            ts.isPropertyAccessExpression(current.expression) &&
            current.expression.name.text === "dispatchEvent" &&
            (!context.program || isOwnPlatformEventDispatch(current, node, context.checker, context.program))) {
            const event = current.arguments[0];
            if (event && ts.isNewExpression(event) && (ts.isIdentifier(event.expression) || (context.program && ts.isPropertyAccessExpression(event.expression)))) {
                const eventName = resolveStaticString(event.arguments?.[0], node.getSourceFile(), context.checker, new Set(), Boolean(context.program));
                const eventType = resolveEventConstructor(event.expression, node.getSourceFile(), context);
                if (context.program && !eventName) throw new Error("Inferred event name requires a stable literal or const binding");
                if (context.program && eventName && !eventType) throw new Error("Inferred event constructor requires an owned platform Event/CustomEvent");
                if (eventName && eventType) {
                    const detail = eventType === "CustomEvent" ? getCustomEventDetail(event, context) : undefined;
                    byName.set(eventName, {
                        name: eventName,
                        type: eventType,
                        detail,
                    });
                }
            }
        }
        ts.forEachChild(current, visit);
    }
    ts.forEachChild(node, visit);
    return byName.size ? [...byName.values()] : undefined;
}
function resolveEventConstructor(expression, sourceFile, context) {
    if (context.program) {
        if (context.program.getTypeChecker() !== context.checker || context.program.getSourceFile(sourceFile.fileName) !== sourceFile)
            throw new Error("Event extraction requires its owning Program");
        const seen = new Set();
        function target(value) {
            if (!ts.isIdentifier(value) && !ts.isPropertyAccessExpression(value)) return undefined;
            if (context.program.getSourceFile(value.getSourceFile().fileName) !== value.getSourceFile()) throw new Error("Foreign event constructor source");
            let symbol = context.checker.getSymbolAtLocation(value);
            if (symbol?.flags & ts.SymbolFlags.Alias) symbol = context.checker.getAliasedSymbol(symbol);
            if (!symbol?.declarations?.length || seen.has(symbol)) return undefined;
            seen.add(symbol);
            if (["Event", "CustomEvent"].includes(symbol.name) && symbol.declarations.every(node => context.program.isSourceFileDefaultLibrary(node.getSourceFile()))) return symbol.name;
            if (symbol.declarations.length !== 1) return undefined;
            const declaration = symbol.declarations[0];
            if (!ts.isVariableDeclaration(declaration) || declaration.type || !declaration.initializer ||
                !ts.isVariableDeclarationList(declaration.parent) || !(declaration.parent.flags & ts.NodeFlags.Const)) return undefined;
            return target(declaration.initializer);
        }
        return target(expression);
    }
    // Existing detector callers retain their legacy policy. The own-origin
    // seam supplies program above and never enters this spelling fallback.
    if (expression.text === "Event" || expression.text === "CustomEvent")
        return expression.text;
    for (const statement of sourceFile.statements) {
        if (!ts.isImportDeclaration(statement))
            continue;
        const named = statement.importClause?.namedBindings;
        if (!named || !ts.isNamedImports(named))
            continue;
        const imported = named.elements.find((element) => element.name.text === expression.text);
        const original = imported?.propertyName?.text ?? imported?.name.text;
        if (original === "Event" || original === "CustomEvent")
            return original;
    }
    return undefined;
}
/** Combines detected events with documented events, letting documentation enrich the result. */
export function mergeClassEvents(detected, documented) {
    const byName = new Map();
    for (const event of detected ?? [])
        byName.set(event.name, event);
    for (const event of documented ?? []) {
        const merged = { ...byName.get(event.name), ...event };
        for (const [key, value] of Object.entries(merged)) {
            if (value === undefined)
                delete merged[key];
        }
        byName.set(event.name, merged);
    }
    return byName.size ? [...byName.values()] : undefined;
}
function getCustomEventDetail(event, context) {
    if (context.program) {
        if (!event.arguments?.[1] && !event.typeArguments?.length) return undefined;
        const type = context.checker.getTypeAtLocation(event);
        const detail = context.checker.getPropertyOfType(type, "detail");
        if (!detail) throw new Error("Owned CustomEvent has no semantic detail contract");
        return context.checker.typeToString(context.checker.getTypeOfSymbolAtLocation(detail, event), event, ts.TypeFormatFlags.NoTruncation);
    }
    const init = event.arguments?.[1];
    if (!init || !ts.isObjectLiteralExpression(init))
        return undefined;
    const detail = init.properties.find((property) => ts.isPropertyAssignment(property) && property.name.getText() === "detail");
    return detail ? getNodeTypeText(detail.initializer, context.checker) : undefined;
}
function resolveStaticString(expression, sourceFile, checker, resolving = new Set(), stable = false) {
    if (!expression) return undefined;
    if (ts.isStringLiteralLike(expression)) return expression.text;
    if (!ts.isIdentifier(expression)) return undefined;
    let symbol = checker.getSymbolAtLocation(expression);
    if (symbol?.flags & ts.SymbolFlags.Alias) symbol = checker.getAliasedSymbol(symbol);
    if (!symbol || resolving.has(symbol)) return undefined;
    resolving.add(symbol);
    try {
        const declarations = symbol.declarations?.filter(ts.isVariableDeclaration) ?? [];
        if (declarations.length !== 1 || !declarations[0].initializer) return undefined;
        if (stable && (!ts.isVariableDeclarationList(declarations[0].parent) || !(declarations[0].parent.flags & ts.NodeFlags.Const))) return undefined;
        return resolveStaticString(declarations[0].initializer, declarations[0].getSourceFile(), checker, resolving, stable);
    } finally {resolving.delete(symbol);}
}

/** Only dispatch on the owner's lexical this through the platform method. */
export function isOwnPlatformEventDispatch(call, owner, checker, program) {
    if (program.getTypeChecker() !== checker || program.getSourceFile(owner.getSourceFile().fileName) !== owner.getSourceFile()) throw new Error("Event receiver requires its owning Program");
    const expression = call.expression;
    if (!ts.isPropertyAccessExpression(expression) || expression.expression.kind !== ts.SyntaxKind.ThisKeyword || expression.name.text !== "dispatchEvent") return false;
    if (!hasLexicalClassThis(call, owner)) return false;
    const symbol = checker.getSymbolAtLocation(expression.name);
    return Boolean(symbol?.declarations?.length && symbol.declarations.every(node =>
        program.isSourceFileDefaultLibrary(node.getSourceFile()) && ts.isInterfaceDeclaration(node.parent) && node.parent.name.text === "EventTarget"));
}

export function hasLexicalClassThis(node, owner) {
    let parent = node.parent;
    for (; parent && parent !== owner; parent = parent.parent) {
        if (ts.isClassDeclaration(parent) || ts.isClassExpression(parent) || ts.isFunctionDeclaration(parent) || ts.isFunctionExpression(parent)) return false;
        if ((ts.isMethodDeclaration(parent) || ts.isGetAccessorDeclaration(parent) || ts.isSetAccessorDeclaration(parent) || ts.isConstructorDeclaration(parent)) && parent.parent !== owner) return false;
    }
    return parent === owner;
}
