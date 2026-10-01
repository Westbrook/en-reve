import ts from "@typescript/typescript6";
import { detectClassMembers, mergeClassEvents, detectClassEvents, detectCustomElementRegistrations, discoverFrameworkApis, parseCssMetadata, } from "@wc-toolkit/cem-generator";
import { getJSDocInfo, getNodeTypeText, getParsedTypeText, resolveMeaningfulParsedTypeFromText, parseCemClassTags, parseCemMemberTags, areTypeTextsEquivalent, } from "@wc-toolkit/cem-generator-utils";
export function litPlugin(options = {}) {
    const registeredTags = new Map();
    return {
        name: "lit",
        shouldAnalyze(sourceText) {
            return (/from\s+['"]lit['"]/.test(sourceText) ||
                /extends\s+LitElement/.test(sourceText) ||
                /customElements\.define\s*\(/.test(sourceText));
        },
        onFile(context) {
            const fragment = {};
            const mixins = new Map();
            const registrations = detectCustomElementRegistrations(context.sourceFile);
            for (const [className, tagName] of registrations)
                registeredTags.set(className, tagName);
            ts.forEachChild(context.sourceFile, function visit(node) {
                if (ts.isClassDeclaration(node) && node.name && (options.isLitClass ? options.isLitClass(node, context) : extendsLitElement(node, context.checker))) {
                    const className = node.name.text;
                    const jsdoc = getJSDocInfo(node);
                    const classDoc = parseCemClassTags(node);
                    const discoveredApis = discoverFrameworkApis(node, context.sourceFile, context.checker);
                    const mixinNames = getLitMixinNames(node);
                    for (const name of mixinNames)
                        resolveLitMixin(name, node, context, mixins, new Set());
                    addMixinFragments(fragment, mixins);
                    const ownMembers = getOwnLitMembers(node, context);
                    const baseMembers = getLitBaseClassMembers(node, context, mixins, options.isLitBaseClass);
                    const members = mergeLitMembers(...mixinNames.flatMap((name) => {
                        const mixin = mixins.get(name);
                        return mixin ? [mixin.members] : [];
                    }), baseMembers, ownMembers, undefined);
                    fragment[className] = {
                        name: className,
                        exportName: getExportName(node),
                        module: context.filePath,
                        description: jsdoc.description || undefined,
                        summary: classDoc.summary,
                        deprecated: classDoc.deprecated,
                        tagName: classDoc.tagName ?? getCustomElementTagName(node) ?? registrations.get(className),
                        superclass: getLitSuperclass(node, context.checker),
                        ...(mixinNames.length
                            ? {
                                mixins: mixinNames.map((name) => ({
                                    name,
                                    module: context.filePath,
                                })),
                            }
                            : {}),
                        members,
                        slots: mergeSlots(discoveredApis.slots, classDoc.slots),
                        events: mergeClassEvents(detectClassEvents(node, context), classDoc.events?.map((event) => ({
                            ...event,
                            parsedType: context.typeParsing === "none"
                                ? undefined
                                : resolveMeaningfulParsedTypeFromText(event.type, context.sourceFile, context.checker),
                        }))),
                        cssParts: mergeCssParts(discoveredApis.cssParts, classDoc.cssParts),
                        cssStates: classDoc.cssStates,
                        cssProperties: mergeCssProperties(extractCssCustomProps(node, context.checker), classDoc.cssProperties),
                        omitInherited: classDoc.omitInherited,
                        attributes: classDoc.attributes,
                    };
                    for (const attr of fragment[className].attributes ?? []) {
                        attr.parsedType =
                            context.typeParsing === "none"
                                ? undefined
                                : resolveMeaningfulParsedTypeFromText(attr.type, context.sourceFile, context.checker);
                    }
                    applyMemberToAttributeLinks(fragment[className], classDoc);
                }
                ts.forEachChild(node, visit);
            });
            return fragment;
        },
        afterAllFiles(manifest) {
            const byDeclaration = {};
            for (const module of manifest.modules) {
                for (const declaration of module.declarations) {
                    const tagName = registeredTags.get(declaration.name);
                    if (!tagName || declaration.tagName)
                        continue;
                    byDeclaration[`${module.path}#${declaration.name}`] = { tagName };
                }
            }
            return { byDeclaration };
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
function addMixinFragments(fragment, mixins) {
    for (const [name, mixin] of mixins) {
        if (fragment[name])
            continue;
        fragment[name] = {
            name,
            kind: "mixin",
            customElement: false,
            exportName: mixin.exportName,
            members: mixin.members?.map(({ inheritedFrom: _inheritedFrom, ...member }) => member),
            parameters: [{ name: "superClass" }],
        };
    }
}
function resolveLitMixin(name, anchor, context, mixins, resolving) {
    const existing = mixins.get(name);
    if (existing)
        return existing;
    if (resolving.has(name))
        return undefined;
    resolving.add(name);
    const identifier = findMixinIdentifier(anchor, name);
    const symbol = identifier ? context.checker.getSymbolAtLocation(identifier) : undefined;
    const resolvedSymbol = symbol && symbol.flags & ts.SymbolFlags.Alias
        ? context.checker.getAliasedSymbol(symbol)
        : symbol;
    const declaration = resolvedSymbol?.declarations?.find((candidate) => ts.isFunctionDeclaration(candidate) || ts.isVariableDeclaration(candidate));
    const implementation = declaration ? findMixinImplementation(declaration) : undefined;
    if (!declaration || !implementation) {
        resolving.delete(name);
        return undefined;
    }
    const sourceFile = implementation.getSourceFile();
    const mixinContext = {
        filePath: sourceFile.fileName,
        sourceText: sourceFile.getFullText(),
        sourceFile,
        checker: context.checker,
        typeParsing: context.typeParsing,
    };
    const nestedNames = getLitMixinNames(implementation);
    const nestedMembers = nestedNames.flatMap((nestedName) => {
        const nested = resolveLitMixin(nestedName, implementation, mixinContext, mixins, resolving);
        return nested?.members ? [nested.members] : [];
    });
    const ownMembers = getOwnLitMembers(implementation, mixinContext);
    const members = mergeLitMembers(...nestedMembers, ownMembers)?.map((member) => ({
        ...member,
        inheritedFrom: member.inheritedFrom ?? {
            name,
            module: sourceFile.fileName,
        },
    }));
    if (!members?.length) {
        resolving.delete(name);
        return undefined;
    }
    const declarationModifiers = ts.canHaveModifiers(declaration)
        ? ts.getModifiers(declaration)
        : undefined;
    const result = {
        members,
        exportName: declarationModifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)
            ? name
            : undefined,
    };
    mixins.set(name, result);
    resolving.delete(name);
    return result;
}
function findMixinIdentifier(node, name) {
    const heritage = node.heritageClauses?.find((clause) => clause.token === ts.SyntaxKind.ExtendsKeyword);
    let result;
    function visit(expression) {
        if (result)
            return;
        if (ts.isCallExpression(expression)) {
            if (ts.isIdentifier(expression.expression) && expression.expression.text === name) {
                result = expression.expression;
                return;
            }
            for (const argument of expression.arguments) {
                if (ts.isExpression(argument))
                    visit(argument);
            }
        }
    }
    const expression = heritage?.types[0]?.expression;
    if (expression)
        visit(expression);
    return result;
}
function findMixinImplementation(declaration) {
    const callable = ts.isFunctionDeclaration(declaration)
        ? declaration
        : declaration.initializer &&
            (ts.isArrowFunction(declaration.initializer) ||
                ts.isFunctionExpression(declaration.initializer))
            ? declaration.initializer
            : undefined;
    if (!callable || callable.parameters.length === 0)
        return undefined;
    const parameterName = callable.parameters[0].name.getText();
    let implementation;
    function visit(node) {
        if (implementation)
            return;
        if (ts.isClassDeclaration(node) || ts.isClassExpression(node)) {
            const heritage = node.heritageClauses?.find((clause) => clause.token === ts.SyntaxKind.ExtendsKeyword);
            if (heritage?.types[0] &&
                expressionContainsIdentifier(heritage.types[0].expression, parameterName)) {
                implementation = node;
                return;
            }
        }
        ts.forEachChild(node, visit);
    }
    if (callable.body)
        ts.forEachChild(callable.body, visit);
    return implementation;
}
function expressionContainsIdentifier(expression, name) {
    if (ts.isIdentifier(expression))
        return expression.text === name;
    let found = false;
    ts.forEachChild(expression, (child) => {
        if (!found && ts.isExpression(child))
            found = expressionContainsIdentifier(child, name);
    });
    return found;
}
function getLitMixinNames(node, checker) {
    const names = [];
    const heritage = node.heritageClauses?.find((clause) => clause.token === ts.SyntaxKind.ExtendsKeyword);
    const visit = (expression) => {
        if (!ts.isCallExpression(expression))
            return;
        if (ts.isIdentifier(expression.expression) && expression.expression.text !== "LitElement") {
            names.push(expression.expression.text);
        }
        for (const argument of expression.arguments) {
            if (ts.isCallExpression(argument)) {
                visit(argument);
            }
            else if (checker && ts.isIdentifier(argument) && argument.text !== "LitElement") {
                const symbol = checker.getSymbolAtLocation(argument);
                const resolved = symbol && symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
                const declaration = resolved?.declarations?.find(ts.isClassDeclaration);
                if (declaration) {
                    const base = declaration.heritageClauses?.find((clause) => clause.token === ts.SyntaxKind.ExtendsKeyword);
                    if (base?.types[0])
                        visit(base.types[0].expression);
                }
            }
        }
    };
    const expression = heritage?.types[0]?.expression;
    if (expression)
        visit(expression);
    return [...new Set(names)];
}
function getLitBaseClassMembers(node, context, mixins, isLitBaseClass) {
    const heritage = node.heritageClauses?.find((clause) => clause.token === ts.SyntaxKind.ExtendsKeyword);
    const baseMembers = [];
    const visitedDeclarations = new Set();
    function visit(expression) {
        if (ts.isCallExpression(expression)) {
            for (const argument of expression.arguments)
                visit(argument);
            return;
        }
        if (!ts.isIdentifier(expression) || expression.text === "LitElement")
            return;
        const symbol = context.checker.getSymbolAtLocation(expression);
        const resolved = symbol && symbol.flags & ts.SymbolFlags.Alias
            ? context.checker.getAliasedSymbol(symbol)
            : symbol;
        const declaration = resolved?.declarations?.find(ts.isClassDeclaration);
        if (!declaration || visitedDeclarations.has(declaration) || isLitBaseClass?.(declaration, context))
            return;
        visitedDeclarations.add(declaration);
        const parent = declaration.heritageClauses?.find(clause => clause.token === ts.SyntaxKind.ExtendsKeyword)?.types[0]?.expression;
        if (parent) visit(parent);
        const nestedMembers = getLitMixinNames(declaration, context.checker).flatMap((name) => {
            const mixin = resolveLitMixin(name, declaration, context, mixins, new Set());
            return mixin?.members ? [mixin.members] : [];
        });
        const ownMembers = getOwnLitMembers(declaration, context);
        const members = mergeLitMembers(...nestedMembers, ownMembers);
        if (members) {
            const baseName = declaration.name?.text ?? expression.getText();
            baseMembers.push(members.map((member) => ({
                ...member,
                inheritedFrom: member.inheritedFrom ?? {
                    name: baseName,
                    module: declaration.getSourceFile().fileName,
                },
            })));
        }
    }
    const expression = heritage?.types[0]?.expression;
    if (expression)
        visit(expression);
    return mergeLitMembers(...baseMembers);
}
function getLitSuperclass(node, checker) {
    const heritage = node.heritageClauses?.find((clause) => clause.token === ts.SyntaxKind.ExtendsKeyword);
    const expression = heritage?.types[0]?.expression;
    if (!expression || ts.isCallExpression(expression)) {
        return { name: "LitElement", module: "lit" };
    }
    const name = expression.getText();
    if (name === "LitElement")
        return { name, module: "lit" };
    if (!ts.isIdentifier(expression))
        return { name, module: "lit" };
    const symbol = checker.getSymbolAtLocation(expression);
    const resolved = symbol && symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
    const declaration = resolved?.declarations?.find(ts.isClassDeclaration);
    if (!declaration?.name)
        return { name, module: "lit" };
    return {
        name: declaration.name.text,
        module: declaration.getSourceFile().fileName,
    };
}
function extendsLitElement(node, checker) {
    const heritage = node.heritageClauses?.find((clause) => clause.token === ts.SyntaxKind.ExtendsKeyword);
    const seen = new Set();
    const containsLitElement = (expression) => {
        if (seen.has(expression))
            return false;
        seen.add(expression);
        if (expression.getText() === "LitElement")
            return true;
        if (ts.isCallExpression(expression)) {
            return expression.arguments.some((argument) => containsLitElement(argument));
        }
        if (ts.isIdentifier(expression)) {
            const symbol = checker.getSymbolAtLocation(expression);
            const resolved = symbol && symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
            const declaration = resolved?.declarations?.find(ts.isClassDeclaration);
            const base = declaration?.heritageClauses?.find((clause) => clause.token === ts.SyntaxKind.ExtendsKeyword);
            return !!base?.types[0] && containsLitElement(base.types[0].expression);
        }
        return false;
    };
    return !!heritage?.types.some((type) => containsLitElement(type.expression));
}
/** Detects `@property({...}) name: Type;` and `@state() name: Type;` fields. */
function getDecoratedProperties(node, context) {
    const members = [];
    for (const member of node.members) {
        if (!ts.isPropertyDeclaration(member))
            continue;
        const decorators = ts.getDecorators?.(member) ?? [];
        const propertyDecorator = decorators.find((d) => {
            const name = getDecoratorName(d, node.getSourceFile());
            return [
                "property",
                "state",
                "internalProperty",
                "query",
                "queryAll",
                "queryAsync",
                "queryAssignedElements",
                "queryAssignedNodes",
            ].includes(name ?? "");
        });
        if (!propertyDecorator)
            continue;
        const decoratorName = getDecoratorName(propertyDecorator, node.getSourceFile());
        const isInternal = [
            "state",
            "internalProperty",
            "query",
            "queryAll",
            "queryAsync",
            "queryAssignedElements",
            "queryAssignedNodes",
        ].includes(decoratorName ?? "");
        const options = getDecoratorOptions(propertyDecorator);
        const nameText = member.name.getText();
        const jsdoc = getJSDocInfo(member);
        const memberDoc = parseCemMemberTags(member);
        if (memberDoc.internal)
            continue;
        const modifiers = ts.canHaveModifiers(member) ? ts.getModifiers(member) : undefined;
        const typeText = getNodeTypeText(member, context.checker);
        const parsedTypeText = shouldParseDecoratedType(member, modifiers, context.typeParsing)
            ? getParsedTypeText(member, context.checker)
            : undefined;
        members.push({
            name: nameText,
            kind: "field",
            type: typeText,
            parsedType: parsedTypeText &&
                !areTypeTextsEquivalent(parsedTypeText, typeText, {
                    ignoreUndefined: true,
                })
                ? parsedTypeText
                : undefined,
            description: jsdoc.description || undefined,
            summary: memberDoc.summary,
            deprecated: memberDoc.deprecated,
            privacy: getPrivacy(modifiers),
            static: modifiers?.some((mod) => mod.kind === ts.SyntaxKind.StaticKeyword) || undefined,
            readonly: modifiers?.some((mod) => mod.kind === ts.SyntaxKind.ReadonlyKeyword) || undefined,
            internal: isInternal || memberDoc.internal || undefined,
            attribute: isInternal || options.noAttribute
                ? undefined
                : (options.attribute ?? memberDoc.attribute ?? nameText),
            reflects: options.reflect ?? memberDoc.reflects,
            default: memberDoc.default,
        });
    }
    return members;
}
function shouldParseDecoratedType(member, modifiers, mode) {
    if (mode === "none")
        return false;
    if (mode === "all")
        return true;
    return !modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.PrivateKeyword ||
        modifier.kind === ts.SyntaxKind.ProtectedKeyword ||
        modifier.kind === ts.SyntaxKind.StaticKeyword);
}
// Framework options supplement the source API. Converter constructors describe
// attribute conversion, and cannot narrow an authored property type or union.
const litMetadataOnly = Symbol("litMetadataOnly");
const litAttributeConfigured = Symbol("litAttributeConfigured");
const litDeclareOnly = Symbol("litDeclareOnly");
function getOwnLitMembers(node, context) {
    const byName = new Map((filterLitMembers(detectClassMembers(node, context)) ?? []).map(member => [member.name, member]));
    const constructor = node.members.find(member => ts.isConstructorDeclaration(member) && member.body);
    const ownDeclarations = [...node.members, ...(constructor?.parameters ?? []).filter(parameter => ts.isParameterPropertyDeclaration(parameter, constructor))];
    const sourceDeclarations = new Map(ownDeclarations.filter(member => member.name).map(member => [member.name.getText(), member]));
    const sourceNames = new Set(sourceDeclarations.keys());
    for (const member of byName.values()) {
        const declaration = sourceDeclarations.get(member.name);
        member[litMetadataOnly] = !declaration;
        member[litDeclareOnly] = !!declaration && ts.isPropertyDeclaration(declaration) &&
            !!ts.getModifiers(declaration)?.some(modifier => modifier.kind === ts.SyntaxKind.DeclareKeyword);
    }
    const documentedDefaults = new Map(ownDeclarations.filter(member => member.name).map(member => [member.name.getText(), parseCemMemberTags(member).default]).filter(([, value]) => value !== undefined));
    for (const incoming of [...getDecoratedProperties(node, context), ...(getStaticPropertyMetadata(node) ?? [])]) {
        const existing = byName.get(incoming.name);
        const member = {...existing,
            ...Object.fromEntries(Object.entries(incoming).filter(([, value]) => value !== undefined)),
            // Explicit attribute:false/internal decorators clear any JSDoc link.
            attribute: incoming.attribute};
        if (existing?.type !== undefined) {
            member.type = existing.type;
            member.parsedType = existing.parsedType;
        }
        if (documentedDefaults.has(member.name)) member.default = documentedDefaults.get(member.name);
        member[litMetadataOnly] = !sourceNames.has(member.name);
        member[litAttributeConfigured] = true;
        byName.set(member.name, member);
    }
    return byName.size ? [...byName.values()] : undefined;
}
function mergeLitMembers(...sources) {
    const byName = new Map();
    for (const source of sources) {
        for (const member of source ?? []) {
            const existing = byName.get(member.name);
            const merged = member[litMetadataOnly] && existing
                ? {...existing, ...Object.fromEntries(Reflect.ownKeys(member).filter(key => member[key] !== undefined).map(key => [key, member[key]]))}
                : {...existing, ...member, inheritedFrom: member.inheritedFrom};
            for (const key of ["description", "summary", "deprecated"]) merged[key] = member[key] ?? existing?.[key];
            if (member[litDeclareOnly] && member.default === undefined) merged.default = existing?.default;
            if (member[litAttributeConfigured]) merged.attribute = member.attribute;
            else merged.attribute = member.attribute ?? existing?.attribute;
            if (member[litMetadataOnly] && existing) {
                // Changing Lit conversion options does not redeclare an inherited field.
                if (existing.type !== undefined) {
                    merged.type = existing.type;
                    merged.parsedType = existing.parsedType;
                }
                merged.readonly = existing.readonly;
                merged.privacy = existing.privacy;
                merged.inheritedFrom = existing.inheritedFrom;
            }
            byName.set(member.name, merged);
        }
    }
    return byName.size ? [...byName.values()] : undefined;
}
function getDecoratorName(decorator, sourceFile) {
    const expression = ts.isCallExpression(decorator.expression)
        ? decorator.expression.expression
        : decorator.expression;
    if (!ts.isIdentifier(expression))
        return undefined;
    for (const statement of sourceFile.statements) {
        if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier))
            continue;
        const moduleName = statement.moduleSpecifier.text;
        if (moduleName !== "lit" && moduleName !== "lit/decorators.js")
            continue;
        const named = statement.importClause?.namedBindings;
        if (!named || !ts.isNamedImports(named))
            continue;
        const imported = named.elements.find((element) => element.name.text === expression.text);
        if (imported)
            return imported.propertyName?.text ?? imported.name.text;
    }
    return expression.text;
}
function getDecoratorOptions(decorator) {
    if (!ts.isCallExpression(decorator.expression))
        return {};
    const options = decorator.expression.arguments[0];
    if (!options || !ts.isObjectLiteralExpression(options))
        return {};
    const result = {};
    for (const property of options.properties) {
        if (!ts.isPropertyAssignment(property) || !ts.isIdentifier(property.name))
            continue;
        const name = property.name.text;
        if (name === "attribute") {
            if (property.initializer.kind === ts.SyntaxKind.FalseKeyword) {
                result.noAttribute = true;
                continue;
            }
            if (ts.isStringLiteralLike(property.initializer))
                result.attribute = property.initializer.text;
        }
        else if (name === "reflect" && property.initializer.kind === ts.SyntaxKind.TrueKeyword) {
            result.reflect = true;
        }
        else if (name === "type") {
            result.type = getLitTypeText(property.initializer);
        }
    }
    return result;
}
function getStaticPropertyMetadata(node) {
    const properties = node.members.find((member) => (ts.isPropertyDeclaration(member) || ts.isGetAccessorDeclaration(member)) &&
        member.name.getText() === "properties" &&
        !!(ts.canHaveModifiers(member) ? ts.getModifiers(member) : undefined)?.some((modifier) => modifier.kind === ts.SyntaxKind.StaticKeyword));
    if (!properties)
        return undefined;
    const initializer = ts.isPropertyDeclaration(properties)
        ? properties.initializer
        : properties?.body?.statements.find(ts.isReturnStatement)?.expression;
    if (!initializer || !ts.isObjectLiteralExpression(initializer))
        return undefined;
    const constructorDefaults = getConstructorPropertyDefaults(node);
    const members = [];
    for (const property of initializer.properties) {
        if (!ts.isPropertyAssignment(property) || !property.name)
            continue;
        const name = property.name.getText().replace(/^['"]|['"]$/g, "");
        if (!ts.isObjectLiteralExpression(property.initializer))
            continue;
        const options = getObjectOptions(property.initializer);
        members.push({
            name,
            kind: "field",
            type: options.type,
            attribute: options.noAttribute ? undefined : (options.attribute ?? name),
            reflects: options.reflect,
            default: options.default ?? constructorDefaults.get(name),
        });
    }
    return members;
}
function getConstructorPropertyDefaults(node) {
    const defaults = new Map();
    const constructor = node.members.find(member => ts.isConstructorDeclaration(member) && member.body);
    for (const statement of constructor?.body?.statements ?? []) {
        if (!ts.isExpressionStatement(statement) || !ts.isBinaryExpression(statement.expression))
            continue;
        const assignment = statement.expression;
        if (assignment.operatorToken.kind !== ts.SyntaxKind.EqualsToken)
            continue;
        if (!ts.isPropertyAccessExpression(assignment.left) ||
            assignment.left.expression.kind !== ts.SyntaxKind.ThisKeyword)
            continue;
        defaults.set(assignment.left.name.text, assignment.right.getText());
    }
    return defaults;
}
function getObjectOptions(object) {
    const result = {};
    for (const property of object.properties) {
        if (!ts.isPropertyAssignment(property) || !ts.isIdentifier(property.name))
            continue;
        const name = property.name.text;
        if (name === "attribute") {
            if (property.initializer.kind === ts.SyntaxKind.FalseKeyword) {
                result.noAttribute = true;
                continue;
            }
            if (ts.isStringLiteralLike(property.initializer))
                result.attribute = property.initializer.text;
        }
        else if (name === "reflect" && property.initializer.kind === ts.SyntaxKind.TrueKeyword) {
            result.reflect = true;
        }
        else if (name === "type") {
            result.type = getLitTypeText(property.initializer);
        }
    }
    return result;
}
function getLitTypeText(node) {
    const name = node.getText();
    return ({
        String: "string",
        Number: "number",
        Boolean: "boolean",
        Object: "object",
        Array: "array",
    }[name] ?? name);
}
function getCustomElementTagName(node) {
    for (const decorator of ts.getDecorators?.(node) ?? []) {
        if (getDecoratorName(decorator, node.getSourceFile()) !== "customElement" ||
            !ts.isCallExpression(decorator.expression))
            continue;
        const tag = decorator.expression.arguments[0];
        if (tag && ts.isStringLiteralLike(tag))
            return tag.text;
    }
    return undefined;
}
function filterLitMembers(members) {
    const frameworkMembers = new Set([
        "properties",
        "styles",
        "render",
        "connectedCallback",
        "disconnectedCallback",
        "attributeChangedCallback",
        "adoptedCallback",
        "shouldUpdate",
        "willUpdate",
        "update",
        "updated",
        "firstUpdated",
        "performUpdate",
        "getUpdateComplete",
        "requestUpdate",
        "scheduleUpdate",
        "createRenderRoot",
        "controllers",
        "addController",
        "removeController",
        "hostConnected",
        "hostDisconnected",
    ]);
    const filtered = members?.filter((member) => !frameworkMembers.has(member.name));
    return filtered?.length ? filtered : undefined;
}
function getPrivacy(modifiers) {
    if (!modifiers)
        return undefined;
    if (modifiers.some((m) => m.kind === ts.SyntaxKind.PrivateKeyword))
        return "private";
    if (modifiers.some((m) => m.kind === ts.SyntaxKind.ProtectedKeyword))
        return "protected";
    if (modifiers.some((m) => m.kind === ts.SyntaxKind.PublicKeyword))
        return "public";
    return undefined;
}
function applyMemberToAttributeLinks(classFragment, classDoc) {
    // Capture this before generated rows are appended to the shared attributes array.
    const authoredAttributes = new Set((classDoc.attributes ?? []).map(attribute => attribute.name));
    if (!classFragment.members)
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
        const m = member;
        const attr = typeof m.attribute === "string" ? m.attribute : undefined;
        if (!attr)
            continue;
        const attrs = (classFragment.attributes ??= []);
        let existingAttr = attrs.find((a) => a.name === attr);
        if (!existingAttr) {
            existingAttr = { name: attr };
            attrs.push(existingAttr);
        }
        existingAttr.type = existingAttr.type ?? (typeof m.type === "string" ? m.type : undefined);
        existingAttr.parsedType =
            existingAttr.parsedType ??
                (typeof m.parsedType === "string" ? m.parsedType : undefined);
        existingAttr.description = existingAttr.description ?? member.description;
        existingAttr.summary = existingAttr.summary ?? member.summary;
        existingAttr.deprecated = existingAttr.deprecated ?? member.deprecated;
        existingAttr.default =
            existingAttr.default ??
                (typeof m.default === "string" ? m.default : undefined);
        existingAttr.fieldName =
            existingAttr.fieldName ?? member.name;
        if (!authoredAttributes.has(attr))
            existingAttr.inheritedFrom = existingAttr.inheritedFrom ?? member.inheritedFrom;
    }
}
function mergeCssProperties(a, b) {
    const merged = new Map();
    for (const item of a ?? [])
        merged.set(item.name, item);
    for (const item of b ?? [])
        merged.set(item.name, { ...merged.get(item.name), ...item });
    return merged.size ? [...merged.values()] : undefined;
}
function mergeCssParts(a, b) {
    const merged = new Map();
    for (const item of a ?? [])
        merged.set(item.name, item);
    for (const item of b ?? [])
        merged.set(item.name, { ...merged.get(item.name), ...item });
    return merged.size ? [...merged.values()] : undefined;
}
function mergeSlots(discovered, jsdoc) {
    const merged = new Map();
    for (const slot of discovered ?? [])
        merged.set(slot.name, slot);
    for (const slot of jsdoc ?? [])
        merged.set(slot.name, { ...merged.get(slot.name), ...slot });
    return merged.size ? [...merged.values()] : undefined;
}
function extractCssCustomProps(node, checker) {
    const stylesMember = node.members.find((m) => {
        if (!ts.isPropertyDeclaration(m) || m.name.getText() !== "styles")
            return false;
        const modifiers = ts.canHaveModifiers(m) ? ts.getModifiers(m) : undefined;
        return modifiers?.some((mod) => mod.kind === ts.SyntaxKind.StaticKeyword) ?? false;
    });
    if (!stylesMember)
        return undefined;
    const properties = parseCssMetadata(stylesMember.getText()) ?? [];
    const initializer = stylesMember.initializer;
    if (!initializer)
        return properties.length ? properties : undefined;
    const symbol = ts.isIdentifier(initializer)
        ? checker.getSymbolAtLocation(initializer)
        : undefined;
    const resolvedSymbol = symbol && symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
    for (const declaration of resolvedSymbol?.declarations ?? []) {
        if (!ts.isVariableDeclaration(declaration) || !declaration.initializer)
            continue;
        properties.push(...(parseCssMetadata(declaration.initializer.getText()) ?? []));
    }
    const byName = new Map(properties.map((property) => [property.name, property]));
    return byName.size ? [...byName.values()] : undefined;
}

/** Exact-node own contracts; no superclass/member flattening or mixin discovery. */
export function extractOwnLitClass(node, context) {
    const docs = getJSDocInfo(node), classDoc = parseCemClassTags(node);
    const discovered = discoverFrameworkApis(node, context.sourceFile, context.checker);
    const result = {
        name: node.name?.text, module: context.filePath, exportName: getExportName(node),
        description: docs.description || undefined, summary: classDoc.summary, deprecated: classDoc.deprecated,
        tagName: classDoc.tagName ?? getCustomElementTagName(node),
        members: getOwnLitMembers(node, context),
        slots: mergeSlots(discovered.slots, classDoc.slots),
        events: mergeClassEvents(detectClassEvents(node, context), classDoc.events?.map(event => ({...event,
            parsedType: context.typeParsing === "none" ? undefined : resolveMeaningfulParsedTypeFromText(event.type, context.sourceFile, context.checker)}))),
        cssParts: mergeCssParts(discovered.cssParts, classDoc.cssParts), cssStates: classDoc.cssStates,
        cssProperties: mergeCssProperties(extractCssCustomProps(node, context.checker), classDoc.cssProperties),
        omitInherited: classDoc.omitInherited, attributes: classDoc.attributes,
    };
    for (const attr of result.attributes ?? []) attr.parsedType = context.typeParsing === "none" ? undefined
        : resolveMeaningfulParsedTypeFromText(attr.type, context.sourceFile, context.checker);
    applyMemberToAttributeLinks(result, classDoc);
    return result;
}
