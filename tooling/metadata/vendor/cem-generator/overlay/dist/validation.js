import { checkExportedTypes } from "./validation-provenance.js";
const TARGET_CEM_SCHEMA_VERSION = "2.1.0";
export class ManifestValidationError extends Error {
    failures;
    constructor(failures) {
        super(`Generated manifest validation failed with ${failures.length} error(s).`);
        this.name = "ManifestValidationError";
        this.failures = failures;
    }
}
export function validateGeneratedManifest(manifest, internal, checker, sourceFiles, options = {}, program, constructorBindings) {
    const failures = [];
    const invariants = options.invariants ?? "error";
    const exportTypes = options.exportTypes ?? "off";
    if (invariants !== "off") {
        checkInvariants(manifest, invariants, failures);
    }
    if (exportTypes !== "off") {
        checkExportedTypes(internal, checker, sourceFiles, exportTypes, failures, program, constructorBindings);
    }
    const errors = failures.filter((failure) => failure.severity === "error");
    const warnings = failures.filter((failure) => failure.severity === "warning");
    if (warnings.length) {
        const onWarning = options.onWarning ?? ((message) => console.warn(message));
        for (const warning of warnings)
            onWarning(`${warning.rule}: ${warning.message}`);
    }
    if (errors.length)
        throw new ManifestValidationError(errors);
    return failures;
}
function checkInvariants(manifest, severity, failures) {
    const modules = manifest.modules ?? [];
    const declarations = new Map();
    if (manifest.schemaVersion !== TARGET_CEM_SCHEMA_VERSION) {
        addFailure(failures, "manifest.invariants", severity, `Expected schemaVersion "${TARGET_CEM_SCHEMA_VERSION}" but found "${manifest.schemaVersion}".`);
    }
    for (const module of modules) {
        if (!module.path) {
            addFailure(failures, "manifest.invariants", severity, "A module is missing its path.");
            continue;
        }
        for (const declaration of module.declarations ?? []) {
            const key = `${module.path}#${declaration.name}`;
            declarations.set(key, declaration);
        }
    }
    for (const module of modules) {
        for (const exported of module.exports ?? []) {
            const reference = exported.declaration;
            if (!reference?.name || !reference.module) {
                addFailure(failures, "manifest.invariants", severity, `Module "${module.path}" contains an export without a declaration reference.`);
                continue;
            }
            const declaration = declarations.get(`${reference.module}#${reference.name}`);
            if (!declaration) {
                addFailure(failures, "manifest.invariants", severity, `Export "${exported.name}" in "${module.path}" references missing declaration "${reference.module}#${reference.name}".`);
                continue;
            }
            if (exported.kind === "custom-element-definition" && declaration.tagName !== exported.name) {
                addFailure(failures, "manifest.invariants", severity, `Custom-element export "${exported.name}" does not match declaration tag name for "${reference.name}".`);
            }
        }
    }
}
function addFailure(failures, rule, severity, message) {
    failures.push({ rule, severity, message });
}
