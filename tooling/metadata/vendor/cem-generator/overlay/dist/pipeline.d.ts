import { Plugin } from "./types.js";
import type { Package as CemPackage } from "custom-elements-manifest/schema";
import { type InheritancePluginOptions } from "./inheritance-plugin.js";
import { type ManifestValidationOptions } from "./validation.js";
export declare const TARGET_CEM_SCHEMA_VERSION = "2.1.0";
export interface CustomTagOptions {
    [tagName: string]: {
        /** Emit the tag's value under a different property name. */
        mappedName?: string;
        /** Always collect the tag's values into an array, even a single one. */
        isArray?: boolean;
    };
}
export interface ModulePathResolverOptions {
    /** Transform the source module path into the published runtime module path. */
    modulePathTemplate?: (modulePath: string, name?: string, tagName?: string) => string;
    /** Add a separate module containing the custom-element definition export. */
    definitionPathTemplate?: (modulePath: string, name?: string, tagName?: string) => string;
    /** Add a non-standard module-level type definition path. */
    typeDefinitionPathTemplate?: (modulePath: string, name?: string, tagName?: string) => string;
    /** Class names excluded from path transformations. */
    exclude?: string[];
    /** Disable module path transformations. */
    skip?: boolean;
}
export interface RunOptions {
    /** Install the vanilla detector automatically. Defaults to true. */
    builtinVanilla?: boolean;
    /** Additional plugins beyond the built-in vanilla detector. */
    plugins?: Plugin[];
    /**
     * How to handle conflicting detector values for the same class field.
     *
     * - throw: fail fast on non-equal conflicts
     * - last-wins: let later detector output replace earlier output (default)
     */
    conflictPolicy?: "throw" | "last-wins";
    /** Built-in inheritance materialization; set false to disable. */
    inheritance?: false | InheritancePluginOptions;
    /** Path to tsconfig.json. Defaults to ./tsconfig.json. */
    tsConfigPath?: string;
    /**
     * Glob patterns limiting which program files are analyzed for declarations.
     * If omitted or empty, every non-declaration, non-`node_modules` file in
     * the program is analyzed.
     *
     * Patterns are matched against the absolute file path, the path relative
     * to `process.cwd()`, the path relative to the tsconfig directory, and
     * the basename. Supports `*`, `**`, `?`, `{a,b}`, and `[...]`.
     * A pattern without glob characters acts as an exact-or-directory-prefix
     * match (so `"src/components"` covers everything under that directory).
     */
    include?: string[];
    /**
     * Glob patterns removing files from analysis. Matched the same way as
     * `include`. Exclude wins over include.
     */
    exclude?: string[];
    /**
     * Sort manifest entries alphabetically (modules, declarations, members, attributes, etc.).
     * @default true
     */
    sort?: boolean;
    /**
     * When sorting, move deprecated items to the end of their lists.
     * @default false
     */
    deprecatedLast?: boolean;
    /**
     * Preserve custom JSDoc tags (tags the generator doesn't map to a dedicated
     * manifest field) in the output:
     *
     * - `true` preserves every custom tag automatically.
     * - A map lets you configure per-tag behavior for otherwise-automatic tags:
     *   `mappedName` emits the value under a different property name, and
     *   `isArray` always collects values into an array.
     *
     * Each tag's value is parsed into structured metadata
     * (`{Type} name - description`, `[name=default] - description`, or a bare
     * value) and emitted as a property matching its tag name directly on the
     * class declaration or individual member where it was documented. No
     * `customJsDocTags` array is emitted.
     * @default false
     */
    customJsDocTags?: boolean | CustomTagOptions;
    /** Configure source-to-runtime module path resolution. */
    modulePathResolver?: ModulePathResolverOptions;
    /** Validate the generated manifest before returning it. */
    validation?: ManifestValidationOptions;
    /** Type expansion policy. @default "public" */
    typeParsing?: "none" | "public" | "all";
}
export declare function generateCem(options?: RunOptions): CemPackage;
