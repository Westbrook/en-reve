import ts from "@typescript/typescript6";
export interface JSDocTagInfo {
    tagName: string;
    text: string;
}
export interface JSDocInfo {
    description: string;
    tags: JSDocTagInfo[];
}
export interface ParsedJSDocMemberInfo {
    attribute?: string;
    attributeFromFieldName?: boolean;
    reflects?: boolean;
    internal?: boolean;
    default?: string;
    summary?: string;
    deprecated?: boolean | string;
    customJsDocTags?: Array<{
        name: string;
        text: string;
    }>;
}
export interface ParsedJSDocClassInfo {
    summary?: string;
    tagName?: string;
    deprecated?: boolean | string;
    slots?: Array<{
        name: string;
        description?: string;
    }>;
    cssProperties?: Array<{
        name: string;
        description?: string;
        default?: string;
    }>;
    cssParts?: Array<{
        name: string;
        description?: string;
    }>;
    cssStates?: Array<{
        name: string;
        description?: string;
    }>;
    attributes?: Array<{
        name: string;
        description?: string;
        type?: string;
        default?: string;
    }>;
    properties?: Array<{
        name: string;
        description?: string;
        type?: string;
    }>;
    events?: Array<{
        name: string;
        description?: string;
        type?: string;
    }>;
    omitInherited?: {
        members?: string[];
        attributes?: string[];
        cssProperties?: string[];
        cssParts?: string[];
        cssStates?: string[];
        slots?: string[];
        events?: string[];
    };
    customJsDocTags?: Array<{
        name: string;
        text: string;
    }>;
}
/**
 * Extracts structured JSDoc info (description + tags) from a declaration node
 * using TS's own JSDoc parser, rather than regex-scraping comment text.
 *
 * Shared across every framework plugin — this is exactly the kind of logic
 * that should live once in core-utils instead of being reimplemented per
 * plugin (a known pain point in the original CEM analyzer's built-in
 * framework handlers).
 */
export declare function getJSDocInfo(node: ts.Node): JSDocInfo;
/** Convenience: find every tag of a given name (e.g. all `@fires` tags). */
export declare function getJSDocTagsNamed(node: ts.Node, tagName: string): JSDocTagInfo[];
export declare function parseCemClassTags(node: ts.Node): ParsedJSDocClassInfo;
export declare function parseCemMemberTags(node: ts.Node): ParsedJSDocMemberInfo;
/**
 * Parses the value of a custom JSDoc tag into structured metadata:
 * `{Type} name - description`, `[name=default] - description`, or a bare value.
 * Used for preserved custom tags so `@status beta - not ready for production`
 * becomes `{ name: "beta", description: "not ready for production" }`.
 */
export declare function parseCustomTagValue(rawText: string): {
    name?: string;
    description?: string;
    default?: string;
    type?: string;
} | undefined;
