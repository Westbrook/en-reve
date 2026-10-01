import ts from "@typescript/typescript6";
import { parseCssMetadata } from "./css-metadata.js";
/** Discovers Web Component APIs from JSX, HTML templates, and static events. */
export function discoverFrameworkApis(root, sourceFile, checker) {
    const events = [];
    const slots = [];
    const cssParts = [];
    const cssProperties = [];
    const cssStates = [];
    function visit(node) {
        if (node !== root && (ts.isClassDeclaration(node) || ts.isClassExpression(node))) return;
        if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
            const opening = ts.isJsxElement(node) ? node.openingElement : node;
            const elementName = opening.tagName.getText(sourceFile);
            if (elementName === "slot" && getJsxSlotName(opening) !== undefined) {
                addNamed(slots, {
                    name: getJsxSlotName(opening),
                    description: getJsxLeadingComment(opening, sourceFile),
                });
            }
            for (const name of getJsxAttributeValue(opening, "part")?.split(/\s+/).filter(Boolean) ??
                []) {
                addNamed(cssParts, { name, description: getJsxLeadingComment(opening, sourceFile) });
            }
        }
        if (ts.isTemplateExpression(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
            scanText(node.getText(node.getSourceFile()), templateText(node));
        }
        if (ts.isStringLiteral(node) &&
            /<slot\b|\bpart\s*=|:host\b|--[\w-]+|\.states\.add/.test(node.text)) {
            scanText(node.text);
        }
        if (ts.isCallExpression(node)) {
            if (ts.isPropertyAccessExpression(node.expression) &&
                node.expression.name.text === "dispatchEvent") {
                const event = node.arguments[0];
                if (event &&
                    ts.isNewExpression(event) &&
                    ts.isIdentifier(event.expression) &&
                    (event.expression.text === "Event" || event.expression.text === "CustomEvent")) {
                    const name = getStringArgument(event.arguments?.[0]);
                    if (name)
                        addNamed(events, { name, type: event.expression.text });
                }
            }
            if (ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === "$emit") {
                const name = getStringArgument(node.arguments[0]);
                if (name)
                    addNamed(events, {
                        name,
                        type: "CustomEvent",
                        detail: node.arguments[1]?.getText(sourceFile),
                    });
            }
        }
        ts.forEachChild(node, visit);
    }
    // CSS/state scanners retain the authored source. Only markup discovery uses
    // normalized template segments, so expression sentinels cannot enter CSS metadata.
    function scanText(text, markupText = text) {
        for (const slot of htmlSlots(markupText)) {
            addNamed(slots, {name:slot.name,
                description:getTrailingHtmlComment(markupText.slice(0, slot.index))});
        }
        for (const element of htmlElements(markupText)) {
            const part = element.attributes.get('part');
            if (typeof part !== 'string') continue;
            for (const name of part.split(/\s+/).filter(name => name && !name.includes(dynamicTemplateValue)))
                addNamed(cssParts, {
                    name,
                    description: getTrailingHtmlComment(markupText.slice(0, element.index)),
                });
        }
        for (const property of parseCssMetadata(text) ?? [])
            addNamed(cssProperties, property);
        for (const match of text.matchAll(/\.states\.add\(\s*["']([^"']+)["']\s*\)/g)) {
            addNamed(cssStates, { name: match[1] });
        }
    }
    visit(root);
    if (checker)
        scanReferencedStyles(root, checker);
    return {
        events: events.length ? events : undefined,
        slots: slots.length ? slots : undefined,
        cssParts: cssParts.length ? cssParts : undefined,
        cssProperties: cssProperties.length ? cssProperties : undefined,
        cssStates: cssStates.length ? cssStates : undefined,
    };
    function scanReferencedStyles(styleRoot, typeChecker) {
        function scanExpression(expression, seen) {
            if (ts.isIdentifier(expression)) {
                const symbol = typeChecker.getSymbolAtLocation(expression);
                const resolved = symbol && symbol.flags & ts.SymbolFlags.Alias
                    ? typeChecker.getAliasedSymbol(symbol)
                    : symbol;
                if (!resolved || seen.has(resolved))
                    return;
                seen.add(resolved);
                for (const declaration of resolved.declarations ?? []) {
                    if (ts.isVariableDeclaration(declaration) && declaration.initializer) {
                        scanExpression(declaration.initializer, seen);
                    }
                }
                return;
            }
            if (ts.isArrayLiteralExpression(expression)) {
                for (const element of expression.elements) {
                    if (ts.isExpression(element))
                        scanExpression(element, seen);
                }
                return;
            }
            if (ts.isParenthesizedExpression(expression)) {
                scanExpression(expression.expression, seen);
                return;
            }
            if (ts.isTemplateExpression(expression) || ts.isNoSubstitutionTemplateLiteral(expression)) {
                scanText(expression.getText(expression.getSourceFile()), templateText(expression));
            }
        }
        function visitStyles(node) {
            if (node !== styleRoot && (ts.isClassDeclaration(node) || ts.isClassExpression(node))) return;
            const isStylesProperty = (ts.isPropertyDeclaration(node) || ts.isPropertyAssignment(node)) &&
                node.name.getText(sourceFile) === "styles";
            if (isStylesProperty && node.initializer) {
                scanExpression(node.initializer, new Set());
            }
            ts.forEachChild(node, visitStyles);
        }
        visitStyles(styleRoot);
    }
}
function getJsxSlotName(element) {
    // An unresolved spread can supply or replace the name.
    if (element.attributes.properties.some(ts.isJsxSpreadAttribute)) return undefined;
    const attribute = element.attributes.properties.find(property => ts.isJsxAttribute(property) &&
        ts.isIdentifier(property.name) && property.name.text === "name");
    return attribute ? getJsxAttributeValue(element, "name") : "";
}
function getJsxAttributeValue(element, name) {
    const attribute = element.attributes.properties.find((property) => ts.isJsxAttribute(property) && ts.isIdentifier(property.name) && property.name.text === name);
    const initializer = attribute?.initializer;
    if (initializer && ts.isStringLiteral(initializer)) return initializer.text;
    if (initializer && ts.isJsxExpression(initializer) && initializer.expression && ts.isStringLiteralLike(initializer.expression)) return initializer.expression.text;
    return undefined;
}
function getStringArgument(argument) {
    return argument && ts.isStringLiteralLike(argument) ? argument.text : undefined;
}
function getJsxLeadingComment(node, sourceFile) {
    const before = sourceFile.text.slice(0, node.getStart(sourceFile));
    const start = before.lastIndexOf("{/*");
    if (start < 0)
        return undefined;
    const comment = before.slice(start).match(/^\{\/\*([\s\S]*?)\*\/\}\s*$/);
    return normalizeComment(comment?.[1]);
}
function normalizeComment(value) {
    if (!value)
        return undefined;
    const text = value
        .split("\n")
        .map((line) => line.replace(/^\s*\*\s?/, ""))
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
    return text || undefined;
}
function getTrailingHtmlComment(value) {
    const end = value.lastIndexOf("-->");
    if (end < 0 || value.slice(end + 3).trim())
        return undefined;
    const start = value.lastIndexOf("<!--", end);
    return start >= 0 ? normalizeComment(value.slice(start + 4, end)) : undefined;
}
function addNamed(items, item) {
    const existing = items.find((value) => value.name === item.name);
    if (existing) {
        for (const [key, value] of Object.entries(item)) {
            if (value !== undefined)
                existing[key] = value;
        }
    }
    else
        items.push(item);
}

// Replace actual template expressions with a sentinel before scanning markup.
// A dynamic class value cannot be mistaken for a spread or a dynamic slot name.
const dynamicTemplateValue = '\0';
function templateText(node) {
    return ts.isNoSubstitutionTemplateLiteral(node) ? node.text
        : node.head.text + node.templateSpans.map(span => dynamicTemplateValue + span.literal.text).join('');
}
function* htmlElements(text) {
    let index = 0;
    while (index < text.length) {
        const start = text.indexOf('<', index);
        if (start < 0) return;
        if (text.startsWith('<!--', start)) {
            const end = text.indexOf('-->', start + 4);
            if (end < 0) return;
            index = end + 3;continue;
        }
        const tag = /^<\/?([a-zA-Z][\w:-]*)/.exec(text.slice(start));
        if (!tag) {index = start + 1;continue;}
        index = start + tag[0].length;
        let unknownName = false, closed = false;
        const attributes = new Map();
        while (index < text.length) {
            while (/\s/.test(text[index] ?? '') && index < text.length) index++;
            if (text[index] === '>') {index++;closed = true;break;}
            if (text.startsWith('/>', index)) {index += 2;closed = true;break;}
            const begin = index;
            while (index < text.length && !/[\s=/>]/.test(text[index])) index++;
            if (begin === index) {unknownName = true;index++;continue;}
            const name = text.slice(begin, index).toLowerCase();
            if (name.includes(dynamicTemplateValue)) unknownName = true;
            while (/\s/.test(text[index] ?? '') && index < text.length) index++;
            let value;
            if (text[index] === '=') {
                index++;
                while (/\s/.test(text[index] ?? '') && index < text.length) index++;
                const quote = text[index];
                if (quote === '"' || quote === "'") {
                    const end = text.indexOf(quote, ++index);
                    if (end < 0) return;
                    value = text.slice(index, end);index = end + 1;
                } else {
                    const begin = index;
                    while (index < text.length && !/[\s>]/.test(text[index])) index++;
                    value = text.slice(begin, index);
                }
            }
            // HTML uses the first duplicate attribute.
            if (!attributes.has(name)) attributes.set(name, value);
        }
        if (!closed) return;
        if (tag[0].startsWith('</') || unknownName) continue;
        yield {tag:tag[1].toLowerCase(), attributes, index:start};
    }
}

function* htmlSlots(text) {
    for (const element of htmlElements(text)) {
        if (element.tag !== 'slot') continue;
        const name = element.attributes.has('name') ? element.attributes.get('name') : '';
        if (typeof name === 'string' && !name.includes(dynamicTemplateValue)) yield {name,index:element.index};
    }
}
