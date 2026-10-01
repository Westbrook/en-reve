import ts from "@typescript/typescript6";
import type { Package as CemPackage } from "custom-elements-manifest/schema";
import type { InternalManifest } from "./types.js";
export type ValidationSeverity = "off" | "warning" | "error";
export interface ManifestValidationOptions {
    /** Validate internal CEM references and generated exports. @default "error" */
    invariants?: ValidationSeverity;
    /** Validate that referenced local types are exported. @default "off" */
    exportTypes?: ValidationSeverity;
    /** Receives warnings. Defaults to console.warn. */
    onWarning?: (message: string) => void;
}
export interface ValidationFailure {
    rule: "manifest.invariants" | "manifest.exportTypes";
    severity: Exclude<ValidationSeverity, "off">;
    message: string;
}
export declare class ManifestValidationError extends Error {
    readonly failures: ValidationFailure[];
    constructor(failures: ValidationFailure[]);
}
/** Strict export-type validation requires the Program that owns checker and sourceFiles. */
export declare function validateGeneratedManifest(manifest: CemPackage, internal: InternalManifest, checker: ts.TypeChecker, sourceFiles: ts.SourceFile[], options?: ManifestValidationOptions, program?: ts.Program, constructorBindings?: { assertProgram(program: ts.Program, sources: ts.SourceFile[]): void; assertDeclaration(module: string, declaration: object): void; provenanceUnits(declaration: object): {implementation: ts.ClassLikeDeclaration; callable?: ts.SignatureDeclaration}; isImplementationSymbol(symbol: ts.Symbol): boolean }): ValidationFailure[];
