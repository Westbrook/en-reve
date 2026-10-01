import ts from "@typescript/typescript6";
/**
 * Shared type extraction helper used by detectors.
 *
 * Priority:
 * 1) Explicit type annotation text
 * 2) TypeChecker inference at node location
 */
export declare function getNodeTypeText(node: ts.Node, checker: ts.TypeChecker): string | undefined;
export declare function normalizeTypeText(text: string): string;
/**
 * Expanded/parsed type text for alias-heavy APIs.
 *
 * Example: `Target | undefined` -> `'a' | 'b' | undefined`
 */
export declare function getParsedTypeText(node: ts.Node, checker: ts.TypeChecker): string | undefined;
export declare function getParsedTypeTextFromType(type: ts.Type, checker: ts.TypeChecker, enclosingNode?: ts.Node): string;
export declare function areTypeTextsEquivalent(first: string | undefined, second: string | undefined, options?: {
    ignoreUndefined?: boolean;
}): boolean;
export declare function resolveParsedTypeFromText(typeText: string | undefined, sourceFile: ts.SourceFile, checker: ts.TypeChecker): string | undefined;
export declare function resolveMeaningfulParsedTypeFromText(typeText: string | undefined, sourceFile: ts.SourceFile, checker: ts.TypeChecker): string | undefined;
