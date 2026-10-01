import ts from "@typescript/typescript6";
import {parseCemClassTags} from "@wc-toolkit/cem-generator-utils";
import {isOwnPlatformEventDispatch} from "./api-events.js";

// Retain originating Program symbols for inferred, imported and authored contracts.
export function checkExportedTypes(internal, checker, sourceFiles, severity, failures, program, constructorBindings) {
    if (!program || program.getTypeChecker() !== checker)
        throw new Error("Strict exported-type validation requires its originating TypeScript Program.");
    if (sourceFiles.some(source => program.getSourceFile(source.fileName) !== source))
        throw new Error("Exported-type validation received a source outside its TypeScript Program.");
    const sources = new Map(sourceFiles.map(source => [source.fileName, source]));
    if (constructorBindings) constructorBindings.assertProgram(program, sourceFiles);
    const modules = new Map();
    for (const module of internal.modules) {
        modules.set(module.path, module);
        if (module.source) modules.set(module.source, module);
    }
    const unalias = symbol => symbol && (symbol.flags & ts.SymbolFlags.Alias) ? checker.getAliasedSymbol(symbol) : symbol;
    function ownedClassSymbol(node) {
        const source = node.getSourceFile();
        if ((!ts.isClassDeclaration(node) && !ts.isClassExpression(node)) || program.getSourceFile(source.fileName) !== source) return undefined;
        // The expression type of a generic returned class may be an intersection.
        // Pinned TS6 resolves a class's direct keyword token to its declaration
        // symbol through the public checker API, including anonymous classes.
        const location = node.name ?? node.getChildren(source).find(child => child.kind === ts.SyntaxKind.ClassKeyword && child.parent === node);
        const symbol = location && unalias(checker.getSymbolAtLocation(location));
        return symbol && (symbol.flags & ts.SymbolFlags.Class) && symbol.declarations?.includes(node) ? symbol : undefined;
    }
    const hidden = node => !!(ts.getCombinedModifierFlags(node) & (ts.ModifierFlags.Private | ts.ModifierFlags.Protected))
        || !!(node.name && ts.isPrivateIdentifier(node.name))
        || ts.getJSDocTags(node).some(tag => tag.tagName.text === "internal");
    function exported(symbol, visiting = new Set()) {
        if (!symbol || visiting.has(symbol)) return false;
        const next = new Set(visiting); next.add(symbol);
        return (symbol.declarations ?? []).some(node => {
            const source = node.getSourceFile();
            if (program.getSourceFile(source.fileName) !== source) return false;
            if (program.isSourceFileDefaultLibrary(source)) return true;
            let namespace;
            for (let parent = node.parent; parent && !ts.isSourceFile(parent); parent = parent.parent)
                if (ts.isModuleDeclaration(parent)) { namespace = parent; break; }
            const owner = checker.getSymbolAtLocation(namespace?.name ?? source);
            return !!owner && checker.getExportsOfModule(owner).some(entry => unalias(entry) === symbol)
                && (!namespace || exported(owner, next));
        });
    }
    const namedType = symbol => (symbol?.declarations ?? []).some(node =>
        (ts.isClassDeclaration(node) || ts.isClassExpression(node)) || ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node) || ts.isEnumDeclaration(node));
    function classFor(module, name) {
        if (constructorBindings) {
            const declaration = module.declarations.find(item => item.name === name);
            if (!declaration) return undefined;
            constructorBindings.assertDeclaration(module.path, declaration);
            return constructorBindings.provenanceUnits(declaration).implementation;
        }
        const source = sources.get(module.source);
        if (!source || program.getSourceFile(source.fileName) !== source) return undefined;
        return source.statements.find(node => ts.isClassDeclaration(node) && node.name?.text === name);
    }
    const units = internal.modules.flatMap(module => module.declarations
        .filter(declaration => !constructorBindings || declaration.kind === "class" || declaration.kind === "mixin")
        .map(declaration => ({module, declaration})));
    // Non-class supplementation happens after extraction. Its public functions and
    // variables must still be checked before a clean extraction can be claimed.
    for (const source of sourceFiles) {
        if (program.getSourceFile(source.fileName) !== source) continue;
        const owner = checker.getSymbolAtLocation(source);
        if (!owner) continue;
        for (const exposed of checker.getExportsOfModule(owner)) {
            const symbol = unalias(exposed);
            if (!symbol || !(symbol.flags & (ts.SymbolFlags.Function | ts.SymbolFlags.Variable))) continue;
            const origin = symbol.valueDeclaration ?? symbol.declarations?.[0];
            if (!origin || hidden(origin)) continue;
            units.push({module:modules.get(source.fileName) ?? {path:source.fileName, source:source.fileName},
                declaration:{name:exposed.name}, publicSymbol:symbol, publicOrigin:origin});
        }
    }
    for (const {module, declaration, publicSymbol, publicOrigin} of units) {
        const reported = new Set(), seenTypes = new Set(), seenAnnotations = new Set();
        const fail = message => failures.push({rule:"manifest.exportTypes", severity, message});
        const origin = publicOrigin ?? classFor(module, declaration.name);
        if (!origin) { fail(`No source class origin for ${module.path}#${declaration.name}.`); continue; }
        function checkSymbol(input) {
            const symbol = unalias(input);
            if (!symbol || !symbol.declarations?.length) { fail(`Unresolved type origin in ${module.path}#${declaration.name}.`); return; }
            if (symbol.declarations.every(ts.isTypeParameterDeclaration)) return;
            for (const node of symbol.declarations)
                if (ts.isTypeAliasDeclaration(node) && sources.has(node.getSourceFile().fileName)) inspectAnnotation(node.type);
            // Only the exact graph-proved returned constructor identity is
            // structurally represented by its mixin row. Its members, type
            // arguments and callable signature are still inspected below.
            const implementation = constructorBindings?.isImplementationSymbol(symbol) === true;
            if (implementation || exported(symbol) || reported.has(symbol)) return;
            reported.add(symbol);
            fail(`${declaration.name} references unexported type "${symbol.name}" from "${symbol.declarations[0].getSourceFile().fileName}".`);
        }
        function inspectAnnotation(node) {
            if (!node || seenAnnotations.has(node)) return;
            seenAnnotations.add(node);
            // TypeScript erases some aliases (for example `type Event = string`).
            // Inspect authored annotation symbols before following semantic types.
            if (program.getSourceFile(node.getSourceFile().fileName) !== node.getSourceFile()) {
                fail(`Unowned type annotation in ${module.path}#${declaration.name}.`); return;
            }
            function visit(current) {
                if (ts.isTypeReferenceNode(current) || ts.isImportTypeNode(current)) {
                    const name = ts.isTypeReferenceNode(current) ? current.typeName : current.qualifier;
                    const symbol = name && checker.getSymbolAtLocation(name);
                    if (!symbol) fail(`Unresolved annotation origin in ${module.path}#${declaration.name}.`);
                    else if (namedType(unalias(symbol))) checkSymbol(symbol);
                }
                ts.forEachChild(current, visit);
            }
            visit(node);
        }
        function inspectSignature(signature, location, includeReturn = true) {
            const declaration = signature.getDeclaration();
            inspectAnnotation(declaration?.type);
            for (const parameter of signature.getTypeParameters() ?? []) {
                const constraint = checker.getBaseConstraintOfType(parameter);
                if (constraint) inspectType(constraint, declaration ?? location);
                for (const node of parameter.getSymbol()?.declarations ?? []) {
                    inspectAnnotation(node.constraint); inspectAnnotation(node.default);
                }
            }
            if (includeReturn) {
                inspectType(signature.getReturnType(), declaration ?? location);
                // Inferred predicates can expose a named type even when the
                // ordinary return type is only boolean and no annotation exists.
                inspectType(checker.getTypePredicateOfSignature(signature)?.type, declaration ?? location);
            }
            for (const parameter of [signature.thisParameter, ...signature.getParameters()].filter(Boolean)) {
                for (const node of parameter.declarations ?? []) inspectAnnotation(node.type);
                inspectType(checker.getTypeOfSymbolAtLocation(parameter, parameter.valueDeclaration ?? location), location);
            }
        }
        function inspectHeritage(node) {
            for (const clause of node.heritageClauses ?? []) for (const heritage of clause.types) {
                inspectAnnotation(heritage);
                const base = checker.getTypeAtLocation(heritage);
                const symbol = unalias(base.aliasSymbol ?? base.getSymbol());
                const namedReference = expression => ts.isIdentifier(expression)
                    || (ts.isPropertyAccessExpression(expression) && namedReference(expression.expression));
                const direct = namedReference(heritage.expression)
                    && unalias(checker.getSymbolAtLocation(heritage.expression)) === symbol;
                const external = direct && namedType(symbol) && symbol.declarations?.length
                    && symbol.declarations.every(node => {
                        const source = node.getSourceFile();
                        return program.getSourceFile(source.fileName) === source && !sources.has(source.fileName)
                            && (program.isSourceFileFromExternalLibrary(source) || program.isSourceFileDefaultLibrary(source));
                    });
                if (!external) { inspectType(base, heritage); continue; }
                checkSymbol(symbol);
                // The external base owns its implicit generic defaults. Validate
                // the subclass's authored arguments, including inferred shapes.
                for (const argument of heritage.typeArguments ?? [])
                    inspectType(checker.getTypeAtLocation(argument), argument);
            }
        }
        function externalAncestors(classes) {
            const declarations = new Set(), visited = new Set();
            function visit(type, collect = true) {
                if (!type || visited.has(type)) return;
                visited.add(type);
                if (type.isUnionOrIntersection?.()) for (const part of type.types) visit(part, collect);
                if (type.flags & ts.TypeFlags.TypeParameter) {
                    const constraint = checker.getBaseConstraintOfType(type);
                    if (constraint && constraint !== type) visit(constraint, collect);
                }
                const symbol = unalias(type.getSymbol());
                if (collect) for (const node of symbol?.declarations ?? []) {
                    const source = node.getSourceFile();
                    if ((ts.isClassDeclaration(node) || ts.isClassExpression(node)) && program.getSourceFile(source.fileName) === source &&
                        !sources.has(source.fileName) && (program.isSourceFileFromExternalLibrary(source) || program.isSourceFileDefaultLibrary(source))) declarations.add(node);
                }
                for (const base of type.getBaseTypes?.() ?? []) visit(base);
                // Constructor constraints expose their ancestor instance through
                // a construct signature, including anonymous returned classes.
                for (const signature of checker.getSignaturesOfType(type, ts.SignatureKind.Construct)) visit(checker.getReturnTypeOfSignature(signature), collect);
                if (symbol) {
                    const declared = checker.getDeclaredTypeOfSymbol(symbol);
                    if (declared !== type) visit(declared, collect);
                }
            }
            for (const node of classes) {
                const symbol = ownedClassSymbol(node);
                if (symbol) visit(checker.getDeclaredTypeOfSymbol(symbol), false);
            }
            return declarations;
        }
        function localClassNodes(type, visited = new Set()) {
            if (!type || visited.has(type)) return [];
            visited.add(type);
            const symbol = unalias(type.aliasSymbol ?? type.getSymbol());
            const own = (symbol?.declarations ?? []).filter(node => (ts.isClassDeclaration(node) || ts.isClassExpression(node))
                && program.getSourceFile(node.getSourceFile().fileName) === node.getSourceFile() && sources.has(node.getSourceFile().fileName));
            return [...new Set([...own, ...(type.isUnionOrIntersection?.() ? type.types.flatMap(part => localClassNodes(part, visited)) : [])])];
        }
        function inspectType(type, location) {
            if (!type || seenTypes.has(type)) return;
            seenTypes.add(type);
            if (type.flags & ts.TypeFlags.TypeParameter) {
                const constraint = checker.getBaseConstraintOfType(type);
                if (constraint && constraint !== type) inspectType(constraint, location);
                return;
            }
            const symbol = unalias(type.aliasSymbol ?? type.getSymbol());
            const named = namedType(symbol);
            if (named) checkSymbol(symbol);
            for (const argument of type.aliasTypeArguments ?? []) inspectType(argument, location);
            if ((type.flags & ts.TypeFlags.Object) && (type.objectFlags & ts.ObjectFlags.Reference))
                for (const argument of checker.getTypeArguments(type)) inspectType(argument, location);
            // Stop at a named external/library boundary after checking its type
            // arguments. Local public option types must be expanded so nested
            // callbacks cannot hide an unexported alias behind an exported name.
            const local = named && symbol.declarations.some(node => sources.has(node.getSourceFile().fileName));
            if (named && !local) return;
            const localClasses = localClassNodes(type);
            for (const node of localClasses) inspectHeritage(node);
            const externalBases = externalAncestors(localClasses);
            if (type.isUnionOrIntersection()) for (const item of type.types) inspectType(item, location);
            if (!(type.flags & ts.TypeFlags.Object)) return;
            for (const property of type.getProperties()) {
                // An inherited framework member belongs to its external class's
                // opaque contract. Own members and heritage type arguments still
                // undergo strict origin/export validation above and below.
                if (localClasses.length && property.declarations?.length
                    && property.declarations.every(node => externalBases.has(node.parent))) continue;
                if (property.declarations?.length && property.declarations.every(hidden)) continue;
                for (const node of property.declarations ?? [])
                    if (!ts.isMethodDeclaration(node) && !ts.isMethodSignature(node)) inspectAnnotation(node.type);
                inspectType(checker.getTypeOfSymbolAtLocation(property, property.valueDeclaration ?? location), location);
            }
            for (const info of checker.getIndexInfosOfType(type)) {
                inspectAnnotation(info.declaration?.type);
                inspectType(info.keyType, location); inspectType(info.type, location);
            }
            for (const kind of [ts.SignatureKind.Call, ts.SignatureKind.Construct])
                for (const signature of checker.getSignaturesOfType(type, kind))
                    inspectSignature(signature, location);
        }
        if (publicSymbol) {
            if (ts.isVariableDeclaration(publicOrigin)) inspectAnnotation(publicOrigin.type);
            inspectType(checker.getTypeOfSymbolAtLocation(publicSymbol, publicOrigin), publicOrigin);
            continue;
        }
        const units = constructorBindings?.provenanceUnits(declaration);
        if (units?.callable) {
            const signature = checker.getSignatureFromDeclaration(units.callable);
            if (!signature) { fail(`Unresolved mixin callable ${module.path}#${declaration.name}.`); continue; }
            inspectSignature(signature, units.callable);
        }
        const classSymbol = ownedClassSymbol(origin);
        if (!classSymbol) { fail(`Unresolved source class ${module.path}#${declaration.name}.`); continue; }
        inspectHeritage(origin);
        const instance = checker.getDeclaredTypeOfSymbol(classSymbol);
        const constructor = checker.getTypeOfSymbolAtLocation(classSymbol, origin);
        // Constructor parameter-property privacy affects the stored field, not
        // the public constructor's callable parameter contract.
        for (const signature of checker.getSignaturesOfType(constructor, ts.SignatureKind.Construct)) {
            const node = signature.getDeclaration();
            if (node && hidden(node)) continue;
            inspectSignature(signature, origin, false);
        }
        function propertyType(name, isStatic = false, publicAttribute = false) {
            const property = checker.getPropertyOfType(isStatic ? constructor : instance, name);
            if (!property) { fail(`No source member origin for ${module.path}#${declaration.name}.${name}.`); return; }
            if (!publicAttribute && property.declarations?.length && property.declarations.every(hidden)) return;
            for (const node of property.declarations ?? []) {
                if (!ts.isMethodDeclaration(node) && !ts.isMethodSignature(node)) inspectAnnotation(node.type);
                if (ts.isGetAccessorDeclaration(node) || ts.isSetAccessorDeclaration(node)) {
                    const signature = checker.getSignatureFromDeclaration(node);
                    if (signature) inspectSignature(signature, node);
                }
            }
            inspectType(checker.getTypeOfSymbolAtLocation(property, property.valueDeclaration ?? origin), origin);
        }
        for (const member of declaration.members ?? []) {
            if (["private", "protected"].includes(member.privacy) || member.internal) continue;
            propertyType(member.name, member.static === true);
        }
        for (const attribute of declaration.attributes ?? []) {
            const node = contractOrigin(attribute);
            // Share extraction's parsed attribute identity, including bracket
            // defaults. Every matching authored type remains subject to public
            // visibility checks even if a merge chose another documentation row.
            const authored = node ? (parseCemClassTags(node).attributes ?? [])
                .filter(row => row.name === attribute.name && row.type !== undefined) : [];
            for (const row of authored) inspectAuthoredType(row.type, node);
            // The attribute is a public contract even when its implementation
            // field is private. State-only/internal fields have no attribute row.
            if (attribute.fieldName) propertyType(attribute.fieldName, false, true);
            else if (!authored.length && (attribute.type || attribute.parsedType))
                fail(`No source field origin for attribute ${module.path}#${declaration.name}.${attribute.name}.`);
        }
        function contractOrigin(event) {
            if (!event.inheritedFrom) return origin;
            const baseModule = modules.get(event.inheritedFrom.module ?? module.path);
            return baseModule && classFor(baseModule, event.inheritedFrom.name);
        }
        function documentedType(node, name, tags) {
            for (const tag of ts.getJSDocTags(node)) {
                if (!tags.includes(tag.tagName.text) || typeof tag.comment !== "string") continue;
                const text = tag.comment.trim();
                if (!text.startsWith("{")) continue;
                let depth = 0;
                for (let i = 0; i < text.length; i++) {
                    if (text[i] === "{") depth++;
                    if (text[i] === "}" && --depth === 0) {
                        if (text.slice(i + 1).trim().split(/\s/)[0] === name) return text.slice(1, i);
                        break;
                    }
                }
            }
        }
        function inspectAuthoredType(text, scope) {
            // The temporary AST is syntax only. It is never passed to the checker.
            // Names are bound against owned source/module symbols; inferred member
            // and event types use inspectType and never pass through this path.
            const parsed = ts.createSourceFile("__cem_authored_type.ts", `type __Cem = ${text};`, ts.ScriptTarget.Latest, true);
            if (parsed.parseDiagnostics.length || parsed.statements.length !== 1 || !ts.isTypeAliasDeclaration(parsed.statements[0])) {
                fail(`Invalid authored contract type for ${module.path}#${declaration.name}.`); return;
            }
            function part(symbol, name) {
                symbol = unalias(symbol);
                if (!symbol) return undefined;
                return symbol.flags & ts.SymbolFlags.Module
                    ? checker.getExportsOfModule(symbol).find(entry => entry.name === name)
                    : checker.getTypeOfSymbolAtLocation(symbol, scope).getProperty(name);
            }
            function entity(node, meaning) {
                return ts.isIdentifier(node)
                    ? checker.resolveName(node.text, scope, meaning | ts.SymbolFlags.Alias, false)
                    : part(entity(node.left, meaning | ts.SymbolFlags.Namespace), node.right.text);
            }
            function qualified(symbol, node) {
                return ts.isIdentifier(node) ? part(symbol, node.text) : part(qualified(symbol, node.left), node.right.text);
            }
            function bound(symbol, meaning) {
                symbol = unalias(symbol);
                if (!symbol || !(symbol.flags & meaning)) { fail(`Authored contract symbol has no requested type/value meaning in ${module.path}#${declaration.name}.`); return; }
                checkSymbol(symbol);
                if (symbol && namedType(symbol)) inspectType(checker.getDeclaredTypeOfSymbol(symbol), scope);
            }
            function visit(node) {
                if (ts.isTypeReferenceNode(node)) bound(entity(node.typeName, ts.SymbolFlags.Type), ts.SymbolFlags.Type);
                if (ts.isTypeQueryNode(node)) bound(entity(node.exprName, ts.SymbolFlags.Value), ts.SymbolFlags.Value);
                if (ts.isImportTypeNode(node)) {
                    if (!ts.isLiteralTypeNode(node.argument) || !ts.isStringLiteral(node.argument.literal) || !node.qualifier) {
                        fail(`Unsupported authored import type for ${module.path}#${declaration.name}.`); return;
                    }
                    const resolved = ts.resolveModuleName(node.argument.literal.text, scope.getSourceFile().fileName, program.getCompilerOptions(), ts.sys).resolvedModule;
                    const source = resolved && program.getSourceFile(resolved.resolvedFileName);
                    const symbol = source && checker.getSymbolAtLocation(source);
                    bound(symbol && qualified(symbol, node.qualifier), node.isTypeOf ? ts.SymbolFlags.Value : ts.SymbolFlags.Type);
                }
                ts.forEachChild(node, visit);
            }
            visit(parsed.statements[0].type);
        }
        for (const event of declaration.events ?? []) {
            if (["private", "protected"].includes(event.privacy)) continue;
            const node = contractOrigin(event);
            if (!node) { fail(`No source event origin for ${module.path}#${declaration.name}.${event.name}.`); continue; }
            if (ts.getJSDocTags(node).some(tag => tag.tagName.text === "internalEvent" && typeof tag.comment === "string" && tag.comment.trim().split(/\s/)[0] === event.name)) continue;
            // The extraction-owned method validates one exact original row/tag
            // through its private captured visibility proof. Whole callable,
            // heritage and own/shadowed source checks above remain mandatory.
            if (constructorBindings?.checkedCapturedEventVisibility?.(declaration, event) === true) continue;
            const authored = documentedType(node, event.name, ["fires", "event"]);
            if (authored) { inspectAuthoredType(authored, node); continue; }
            let found = false;
            function visit(current) {
                if (ts.isClassDeclaration(current) || ts.isClassExpression(current)) return;
                if (ts.isCallExpression(current) && ts.isPropertyAccessExpression(current.expression) && current.expression.name.text === "dispatchEvent" && (!constructorBindings || isOwnPlatformEventDispatch(current, node, checker, program))) {
                    const expression = current.arguments[0];
                    const name = expression && ts.isNewExpression(expression) && expression.arguments?.[0];
                    const nameType = name && checker.getTypeAtLocation(name);
                    if (nameType?.isStringLiteral() && nameType.value === event.name) {
                        found = true; inspectType(checker.getTypeAtLocation(expression), expression);
                    }
                }
                ts.forEachChild(current, visit);
            }
            ts.forEachChild(node, visit);
            if (!found) fail(`No verifiable authored or inferred event type for ${module.path}#${declaration.name}.${event.name}.`);
        }
    }
}
