import ts from "@typescript/typescript6";
import path from "node:path";
import fs from "node:fs";
import { parseCustomTagValue } from "@wc-toolkit/cem-generator-utils";
import { isDetectorPlugin, isAnnotatorPlugin, } from "./types.js";
import { vanillaBuiltin } from "./vanilla-builtin.js";
import { cssBuiltin } from "./css-builtin.js";
import { buildInheritancePatch, extractExternalModules, } from "./inheritance-plugin.js";
import { validateGeneratedManifest } from "./validation.js";
export const TARGET_CEM_SCHEMA_VERSION = "2.1.0";
const DEFAULT_TS_CONFIG_PATH = "./tsconfig.json";
export function generateCem(options = {}) {
    const { builtinVanilla = true, plugins = [], conflictPolicy = "last-wins", inheritance = {}, tsConfigPath, include, exclude, sort = true, deprecatedLast = true, customJsDocTags = false, modulePathResolver = {}, validation, typeParsing = "public", } = options;
    const { modulePathTemplate, definitionPathTemplate, typeDefinitionPathTemplate, exclude: modulePathExclude = [], skip: modulePathSkip = false, } = modulePathResolver;
    const customJsDocTagsConfig = typeof customJsDocTags === "object" && customJsDocTags !== null
        ? customJsDocTags
        : customJsDocTags
            ? {}
            : undefined;
    const configFilePath = tsConfigPath ?? DEFAULT_TS_CONFIG_PATH;
    const resolvedPath = path.resolve(configFilePath);
    const programResult = createProgramResult(resolvedPath);
    const { program, checker, sourceFiles } = programResult;
    const projectDir = path.dirname(resolvedPath);
    const runtimeResolver = modulePathSkip
        ? (sourceFile) => sourceFile
        : createRuntimeResolver(projectDir, readCompilerOptions(resolvedPath));
    const allPlugins = [...(builtinVanilla ? [vanillaBuiltin()] : []), cssBuiltin(), ...plugins];
    const additionalFiles = getAdditionalPluginFiles(projectDir, allPlugins, sourceFiles, program.getCompilerOptions());
    const cssFiles = getCssFiles(projectDir, [...sourceFiles, ...additionalFiles], program.getCompilerOptions());
    const filteredFiles = filterSourceFiles([...sourceFiles, ...additionalFiles, ...cssFiles], include, exclude, projectDir);
    const detectors = allPlugins.filter(isDetectorPlugin);
    const annotators = allPlugins.filter(isAnnotatorPlugin);
    const manifest = { schemaVersion: TARGET_CEM_SCHEMA_VERSION, modules: [] };
    for (const sourceFile of filteredFiles) {
        const moduleDeclarations = analyzeFile(sourceFile, checker, detectors, conflictPolicy, typeParsing);
        if (moduleDeclarations.length > 0) {
            const pathDeclaration = moduleDeclarations.find((declaration) => declaration.tagName && !modulePathExclude.includes(declaration.name));
            const sourcePath = sourceFile.fileName;
            const resolvedPath = modulePathSkip
                ? sourcePath
                : modulePathTemplate
                    ? normalizeModulePath(modulePathTemplate(sourcePath, pathDeclaration?.name, pathDeclaration?.tagName))
                    : runtimeResolver(sourcePath);
            manifest.modules.push({
                source: sourcePath,
                path: resolvedPath,
                ...(!modulePathSkip && typeDefinitionPathTemplate && pathDeclaration
                    ? {
                        typeDefinitionPath: normalizeModulePath(typeDefinitionPathTemplate(sourcePath, pathDeclaration.name, pathDeclaration.tagName)),
                    }
                    : {}),
                declarations: moduleDeclarations,
            });
        }
    }
    applyDetectorAfterAllFiles(manifest, detectors);
    applyBuiltInInheritance(manifest, inheritance);
    applyAnnotators(manifest, annotators);
    const cem = toCemPackage(manifest, {
        sort,
        deprecatedLast,
        customJsDocTags: customJsDocTagsConfig,
        definitionPathTemplate: modulePathSkip ? undefined : definitionPathTemplate,
        excludedNames: new Set(modulePathExclude),
    });
    normalizeSourcePaths(cem, projectDir);
    validateGeneratedManifest(cem, manifest, checker,
        filteredFiles.filter(source => program.getSourceFile(source.fileName) === source),
        validation, program);
    for (const plugin of allPlugins) {
        plugin.afterGenerate?.(cem);
    }
    return cem;
}
function getCssFiles(projectDir, existingFiles, compilerOptions) {
    const existing = new Set(existingFiles.map((file) => path.resolve(file.fileName)));
    const result = [];
    function visit(directory) {
        for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
            if (["node_modules", ".git", "dist", ".astro"].includes(entry.name))
                continue;
            const filePath = path.join(directory, entry.name);
            if (entry.isDirectory()) {
                visit(filePath);
            }
            else if (entry.isFile() &&
                entry.name.endsWith(".css") &&
                !existing.has(path.resolve(filePath))) {
                result.push(ts.createSourceFile(filePath, fs.readFileSync(filePath, "utf-8"), compilerOptions.target ?? ts.ScriptTarget.Latest, true, ts.ScriptKind.Unknown));
            }
        }
    }
    visit(projectDir);
    return result;
}
function normalizeSourcePaths(cem, projectDir) {
    for (const module of cem.modules ?? []) {
        const source = module.source;
        if (!source || !path.isAbsolute(source))
            continue;
        module.source = normalizeModulePath(path.relative(projectDir, source));
    }
}
function getAdditionalPluginFiles(projectDir, plugins, existingFiles, compilerOptions) {
    if (!plugins.some((plugin) => isDetectorPlugin(plugin) && plugin.name === "svelte"))
        return [];
    const existing = new Set(existingFiles.map((file) => path.resolve(file.fileName)));
    const result = [];
    function visit(directory) {
        for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
            if (entry.name === "node_modules" ||
                entry.name === ".git" ||
                entry.name === "dist" ||
                entry.name === ".astro")
                continue;
            const filePath = path.join(directory, entry.name);
            if (entry.isDirectory()) {
                visit(filePath);
            }
            else if (entry.isFile() &&
                entry.name.endsWith(".svelte") &&
                !existing.has(path.resolve(filePath))) {
                const sourceText = fs.readFileSync(filePath, "utf-8");
                result.push(ts.createSourceFile(filePath, sourceText, compilerOptions.target ?? ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX));
            }
        }
    }
    visit(projectDir);
    return result;
}
function readCompilerOptions(configFilePath) {
    const configFile = ts.readConfigFile(configFilePath, ts.sys.readFile);
    if (configFile.error)
        return {};
    return ts.parseJsonConfigFileContent(configFile.config, ts.sys, path.dirname(configFilePath))
        .options;
}
function createRuntimeResolver(projectDir, compilerOptions) {
    const relativeSourcePath = (sourceFile) => toPosixPath(path.relative(projectDir, sourceFile));
    const packageRoot = findPackageRoot(projectDir);
    if (!packageRoot)
        return relativeSourcePath;
    const packageJsonPath = path.join(packageRoot, "package.json");
    let packageJson;
    try {
        packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
    }
    catch {
        return relativeSourcePath;
    }
    const targets = readExportTargets(packageJson.exports);
    if (targets.length === 0)
        return relativeSourcePath;
    return (sourceFile) => {
        const relativeSource = toPosixPath(path.relative(packageRoot, sourceFile));
        const sourceRoot = compilerOptions.rootDir
            ? path.resolve(packageRoot, compilerOptions.rootDir)
            : projectDir;
        const rootRelative = toPosixPath(path.relative(sourceRoot, sourceFile)).replace(/\.(tsx?|mts|cts|jsx?|mjs|cjs)$/, "");
        const exportResolved = resolveExportedSourcePath(targets, rootRelative);
        if (exportResolved)
            return exportResolved;
        const runtimeCandidates = outputCandidates(relativeSource, projectDir, packageRoot, compilerOptions);
        const runtimeCandidate = runtimeCandidates.find((candidate) => candidate.endsWith(".js"));
        const declarationCandidate = runtimeCandidate?.replace(/\.js$/, ".d.ts");
        for (const target of targets) {
            const declarationForTypes = target.types?.endsWith("*")
                ? declarationCandidate?.replace(/\.d\.ts$/, "")
                : declarationCandidate;
            const match = matchExportTarget(target.types, declarationForTypes) ??
                matchExportTarget(target.runtime, runtimeCandidate);
            if (match !== undefined && target.runtime) {
                const resolved = normalizeModulePath(target.runtime.replace(/^\.\//, "").replace("*", match));
                if (!path.posix.extname(resolved) && target.runtime.endsWith("*") && runtimeCandidate) {
                    return `${resolved}${path.posix.extname(runtimeCandidate)}`;
                }
                return resolved;
            }
        }
        return (runtimeCandidates.find((candidate) => candidate.endsWith(".js")) ??
            relativeSourcePath(sourceFile));
    };
}
function resolveExportedSourcePath(targets, rootRelative) {
    for (const target of targets) {
        if (!target.runtime?.includes("*"))
            continue;
        const runtimeTarget = target.runtime.replace(/^\.\//, "");
        const wildcardIndex = runtimeTarget.indexOf("*");
        const prefix = runtimeTarget.slice(0, wildcardIndex);
        const prefixSegments = prefix.split("/").filter(Boolean);
        const rootSegments = rootRelative.split("/").filter(Boolean);
        let wildcard = rootRelative;
        let matchedPrefix = prefixSegments.length <= 1;
        for (let index = 0; index < prefixSegments.length; index += 1) {
            const suffix = prefixSegments.slice(index).join("/");
            if (rootRelative === suffix || rootRelative.startsWith(`${suffix}/`)) {
                wildcard = rootRelative.slice(suffix.length).replace(/^\//, "");
                matchedPrefix = true;
                break;
            }
        }
        if (!matchedPrefix)
            continue;
        let candidate = normalizeModulePath(runtimeTarget.replace("*", wildcard));
        if (!path.posix.extname(candidate))
            candidate += ".js";
        if (candidate && rootSegments.length > 0)
            return candidate;
    }
    return undefined;
}
function findPackageRoot(startDir) {
    let current = path.resolve(startDir);
    while (true) {
        if (fs.existsSync(path.join(current, "package.json")))
            return current;
        const parent = path.dirname(current);
        if (parent === current)
            return undefined;
        current = parent;
    }
}
function readExportTargets(exportsField) {
    if (typeof exportsField === "string" || Array.isArray(exportsField)) {
        return [{ key: ".", ...readExportConditionTargets(exportsField) }];
    }
    if (!exportsField || typeof exportsField !== "object")
        return [];
    const record = exportsField;
    const entries = Object.keys(record).some((key) => key.startsWith("."))
        ? Object.entries(record)
        : [[".", exportsField]];
    const targets = [];
    for (const [key, value] of entries) {
        if (!key.startsWith("."))
            continue;
        targets.push({ key, ...readExportConditionTargets(value) });
    }
    return targets.sort((a, b) => {
        const aWildcard = a.key.includes("*");
        const bWildcard = b.key.includes("*");
        if (aWildcard !== bWildcard)
            return aWildcard ? 1 : -1;
        return b.key.length - a.key.length;
    });
}
function readExportConditionTargets(value) {
    return {
        types: resolveExportCondition(value, ["types"]),
        runtime: resolveExportCondition(value, ["import", "default", "node", "browser"]),
    };
}
function resolveExportCondition(value, preferredConditions) {
    if (typeof value === "string")
        return value;
    if (Array.isArray(value)) {
        for (const candidate of value) {
            const resolved = resolveExportCondition(candidate, preferredConditions);
            if (resolved)
                return resolved;
        }
        return undefined;
    }
    if (!value || typeof value !== "object")
        return undefined;
    const record = value;
    for (const condition of [...preferredConditions, ...Object.keys(record)]) {
        if (!(condition in record))
            continue;
        const resolved = resolveExportCondition(record[condition], preferredConditions);
        if (resolved)
            return resolved;
    }
    return undefined;
}
function outputCandidates(relativeSource, projectDir, packageRoot, compilerOptions) {
    const sourceRoot = compilerOptions.rootDir
        ? path.resolve(projectDir, compilerOptions.rootDir)
        : projectDir;
    const outputRoot = compilerOptions.outDir
        ? path.resolve(projectDir, compilerOptions.outDir)
        : projectDir;
    const sourcePath = path.resolve(packageRoot, relativeSource);
    const sourceRelativeToRoot = toPosixPath(path.relative(sourceRoot, sourcePath));
    const rootRelative = sourceRelativeToRoot.replace(/\.(tsx?|mts|cts|jsx?|mjs|cjs)$/, "");
    const relativeToProject = toPosixPath(path.relative(projectDir, sourcePath));
    const outputRelative = compilerOptions.outDir
        ? rootRelative
        : relativeToProject.replace(/\.(tsx?|mts|cts|jsx?|mjs|cjs)$/, "");
    const candidates = [
        toPosixPath(path.relative(projectDir, path.join(outputRoot, `${outputRelative}.js`))),
        toPosixPath(path.relative(projectDir, path.join(outputRoot, `${outputRelative}.mjs`))),
        toPosixPath(path.relative(projectDir, path.join(outputRoot, `${outputRelative}.cjs`))),
        `${relativeToProject.replace(/\.(tsx?|mts|cts|jsx?|mjs|cjs)$/, ".js")}`,
    ];
    return [...new Set(candidates)];
}
function matchExportTarget(target, candidate) {
    if (!target || !candidate)
        return undefined;
    const normalizedTarget = target.replace(/^\.\//, "");
    if (!normalizedTarget.includes("*"))
        return normalizedTarget === candidate ? "" : undefined;
    const [prefix, suffix] = normalizedTarget.split("*");
    if (!candidate.startsWith(prefix) || !candidate.endsWith(suffix))
        return undefined;
    return candidate.slice(prefix.length, candidate.length - suffix.length || undefined);
}
function createProgramResult(configFilePath) {
    const configFile = ts.readConfigFile(configFilePath, ts.sys.readFile);
    if (configFile.error) {
        const fallback = createDefaultProgram(path.dirname(configFilePath));
        return fallback;
    }
    const parsed = ts.parseJsonConfigFileContent(configFile.config, ts.sys, path.dirname(configFilePath));
    const options = {
        ...parsed.options,
        allowJs: true,
        checkJs: parsed.options.checkJs ?? false,
    };
    const program = ts.createProgram({ rootNames: parsed.fileNames, options });
    const checker = program.getTypeChecker();
    const sourceFiles = program
        .getSourceFiles()
        .filter((sf) => !sf.isDeclarationFile && !sf.fileName.includes("node_modules"));
    return { program, checker, sourceFiles };
}
function createDefaultProgram(projectDir) {
    const configPath = path.join(projectDir, "tsconfig.json");
    const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
    if (!configFile.error) {
        const parsed = ts.parseJsonConfigFileContent(configFile.config, ts.sys, projectDir);
        const options = {
            ...parsed.options,
            allowJs: true,
            checkJs: parsed.options.checkJs ?? false,
        };
        const program = ts.createProgram({ rootNames: parsed.fileNames, options });
        const checker = program.getTypeChecker();
        const sourceFiles = program
            .getSourceFiles()
            .filter((sf) => !sf.isDeclarationFile && !sf.fileName.includes("node_modules"));
        return { program, checker, sourceFiles };
    }
    const options = { allowJs: true, checkJs: false };
    const program = ts.createProgram({ rootNames: [projectDir], options });
    const checker = program.getTypeChecker();
    const sourceFiles = program
        .getSourceFiles()
        .filter((sf) => !sf.isDeclarationFile && !sf.fileName.includes("node_modules"));
    return { program, checker, sourceFiles };
}
function filterSourceFiles(sourceFiles, include, exclude, projectDir) {
    if ((!include || include.length === 0) && (!exclude || exclude.length === 0)) {
        return sourceFiles;
    }
    return sourceFiles.filter((sf) => {
        if (exclude && exclude.length > 0 && matchesAnyPattern(sf.fileName, exclude, projectDir)) {
            return false;
        }
        if (include && include.length > 0) {
            return matchesAnyPattern(sf.fileName, include, projectDir);
        }
        return true;
    });
}
function matchesAnyPattern(fileName, patterns, projectDir) {
    const candidates = buildMatchCandidates(fileName, projectDir);
    return patterns.some((pattern) => {
        const normalized = normalizeGlobPattern(pattern);
        if (!hasGlobMagic(normalized)) {
            return candidates.some((candidate) => candidate === normalized || candidate.startsWith(`${normalized}/`));
        }
        const re = globToRegExp(normalized);
        return candidates.some((candidate) => re.test(candidate));
    });
}
function buildMatchCandidates(fileName, projectDir) {
    const abs = toPosixPath(fileName);
    const candidates = [abs];
    const relCwd = toPosixPath(path.relative(process.cwd(), fileName));
    if (!relCwd.startsWith(".."))
        candidates.push(relCwd);
    const relProject = toPosixPath(path.relative(projectDir, fileName));
    if (!relProject.startsWith(".."))
        candidates.push(relProject);
    candidates.push(path.posix.basename(abs));
    return candidates;
}
function toPosixPath(p) {
    return p.replace(/\\/g, "/");
}
function normalizeModulePath(modulePath) {
    const normalized = toPosixPath(modulePath);
    const [protocol, ...segments] = normalized.split("://");
    if (segments.length === 0)
        return normalized.replace(/\/{2,}/g, "/");
    return `${protocol}://${segments.join("://").replace(/\/{2,}/g, "/")}`;
}
function normalizeGlobPattern(pattern) {
    let normalized = toPosixPath(pattern).replace(/\/+/g, "/");
    if (normalized.startsWith("./"))
        normalized = normalized.slice(2);
    if (normalized.length > 1 && normalized.endsWith("/"))
        normalized = normalized.slice(0, -1);
    return normalized;
}
function hasGlobMagic(pattern) {
    return /[*?[\]{}]/.test(pattern);
}
function globToRegExpSource(glob) {
    let re = "";
    let i = 0;
    while (i < glob.length) {
        const c = glob[i];
        if (c === "*") {
            if (glob[i + 1] === "*") {
                if (glob[i + 2] === "/") {
                    re += "(?:.*/)?";
                    i += 3;
                }
                else {
                    re += ".*";
                    i += 2;
                }
            }
            else {
                re += "[^/]*";
                i += 1;
            }
        }
        else if (c === "?") {
            re += "[^/]";
            i += 1;
        }
        else if (c === "{") {
            const end = glob.indexOf("}", i);
            if (end === -1) {
                re += "\\{";
                i += 1;
            }
            else {
                const inner = glob
                    .slice(i + 1, end)
                    .split(",")
                    .map((part) => globToRegExpSource(part))
                    .join("|");
                re += `(?:${inner})`;
                i = end + 1;
            }
        }
        else if (c === "[") {
            const end = glob.indexOf("]", i);
            if (end === -1) {
                re += "\\[";
                i += 1;
            }
            else {
                re += glob.slice(i, end + 1);
                i = end + 1;
            }
        }
        else {
            if ("+|^$.()\\".includes(c))
                re += `\\${c}`;
            else
                re += c;
            i += 1;
        }
    }
    return re;
}
function globToRegExp(glob) {
    return new RegExp(`^${globToRegExpSource(glob)}$`);
}
function applyBuiltInInheritance(manifest, inheritance) {
    if (inheritance === false)
        return;
    const patch = buildInheritancePatch(manifest, inheritance);
    applyManifestPatch(manifest, "core:inheritance", patch, "Annotator");
    if (inheritance.includeExternalManifests) {
        mergeExternalModulesIntoManifest(manifest, extractExternalModules(inheritance.externalManifests));
    }
}
function mergeExternalModulesIntoManifest(manifest, externalModules) {
    const existingDeclKeys = new Set();
    for (const mod of manifest.modules) {
        for (const decl of mod.declarations) {
            existingDeclKeys.add(`${mod.path}#${decl.name}`);
        }
    }
    for (const extMod of externalModules) {
        const filtered = extMod.declarations.filter((decl) => !existingDeclKeys.has(`${extMod.path}#${decl.name}`));
        if (filtered.length === 0)
            continue;
        manifest.modules.push({ source: extMod.source, path: extMod.path, declarations: filtered });
        for (const decl of filtered) {
            existingDeclKeys.add(`${extMod.path}#${decl.name}`);
        }
    }
}
function analyzeFile(sourceFile, checker, detectors, conflictPolicy, typeParsing) {
    const sourceText = sourceFile.getFullText();
    const context = {
        filePath: sourceFile.fileName,
        sourceText,
        sourceFile,
        checker,
        typeParsing,
    };
    const claimedByPlugin = new Map();
    function claimed(plugin) {
        if (claimedByPlugin.has(plugin))
            return claimedByPlugin.get(plugin);
        const value = plugin.shouldAnalyze?.(sourceText, sourceFile.fileName) ?? true;
        claimedByPlugin.set(plugin, value);
        return value;
    }
    // merged[className] accumulates fragments from every plugin that analyzes
    // this file.
    const merged = {};
    const fieldOwners = {};
    for (const plugin of detectors) {
        if (!claimed(plugin))
            continue;
        if (!plugin.onFile)
            continue;
        const fragment = plugin.onFile(context);
        for (const [className, classFragment] of Object.entries(fragment)) {
            const target = (merged[className] ??= { name: className });
            const owners = (fieldOwners[className] ??= {});
            mergeClassFragment({
                className,
                target,
                incoming: classFragment,
                pluginName: plugin.name,
                owners,
                conflictPolicy,
            });
        }
    }
    return Object.values(merged);
}
function mergeClassFragment({ className, target, incoming, pluginName, owners, conflictPolicy, }) {
    for (const [field, incomingValue] of Object.entries(incoming)) {
        if (field === "name" || incomingValue === undefined)
            continue;
        const currentValue = target[field];
        const hasCurrentValue = currentValue !== undefined;
        const hasConflict = hasCurrentValue && !deepEqual(currentValue, incomingValue);
        if (hasConflict && conflictPolicy === "throw") {
            const previousPlugin = owners[field] ?? "(unknown)";
            throw new Error(`Detector conflict on "${className}.${field}": plugin "${previousPlugin}" and ` +
                `"${pluginName}" produced different values. ` +
                `Set conflictPolicy: "last-wins" to allow overrides.`);
        }
        if (!hasCurrentValue || conflictPolicy === "last-wins") {
            target[field] = incomingValue;
            owners[field] = pluginName;
        }
    }
}
function deepEqual(a, b) {
    if (Object.is(a, b))
        return true;
    if (typeof a !== "object" || a === null || typeof b !== "object" || b === null) {
        return false;
    }
    if (Array.isArray(a) || Array.isArray(b)) {
        if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length)
            return false;
        for (let i = 0; i < a.length; i += 1) {
            if (!deepEqual(a[i], b[i]))
                return false;
        }
        return true;
    }
    const aObj = a;
    const bObj = b;
    const aKeys = Object.keys(aObj);
    const bKeys = Object.keys(bObj);
    if (aKeys.length !== bKeys.length)
        return false;
    for (const key of aKeys) {
        if (!Object.prototype.hasOwnProperty.call(bObj, key))
            return false;
        if (!deepEqual(aObj[key], bObj[key]))
            return false;
    }
    return true;
}
function applyDetectorAfterAllFiles(manifest, detectors) {
    for (const detector of detectors) {
        if (!detector.afterAllFiles)
            continue;
        const patch = detector.afterAllFiles(manifest);
        applyManifestPatch(manifest, detector.name, patch, "Detector");
    }
}
function applyAnnotators(manifest, annotators) {
    for (const plugin of annotators) {
        const patch = plugin.afterManifest(manifest);
        applyManifestPatch(manifest, plugin.name, patch, "Annotator");
    }
}
function applyManifestPatch(manifest, pluginName, patch, pluginKind) {
    const declarationByKey = new Map();
    for (const mod of manifest.modules) {
        for (const decl of mod.declarations) {
            declarationByKey.set(`${mod.path}#${decl.name}`, decl);
        }
    }
    const isStructuredPatch = !!patch &&
        typeof patch === "object" &&
        ("byDeclaration" in patch ||
            "byClassName" in patch ||
            "replaceByDeclaration" in patch ||
            "replaceByClassName" in patch);
    const byDeclaration = isStructuredPatch && "byDeclaration" in patch ? (patch.byDeclaration ?? {}) : {};
    const byClassName = isStructuredPatch && "byClassName" in patch
        ? (patch.byClassName ?? {})
        : patch;
    const replaceByDeclaration = isStructuredPatch && "replaceByDeclaration" in patch ? (patch.replaceByDeclaration ?? {}) : {};
    const replaceByClassName = isStructuredPatch && "replaceByClassName" in patch ? (patch.replaceByClassName ?? {}) : {};
    for (const [declarationKey, patchForClass] of Object.entries(replaceByDeclaration)) {
        const decl = declarationByKey.get(declarationKey);
        if (!decl || !patchForClass)
            continue;
        Object.assign(decl, patchForClass);
    }
    for (const mod of manifest.modules) {
        for (const decl of mod.declarations) {
            const patchForClass = replaceByClassName[decl.name];
            if (patchForClass)
                Object.assign(decl, patchForClass);
        }
    }
    for (const [declarationKey, patchForClass] of Object.entries(byDeclaration)) {
        const decl = declarationByKey.get(declarationKey);
        if (!decl || !patchForClass)
            continue;
        applyAdditivePatch(pluginKind, pluginName, decl, patchForClass);
    }
    for (const mod of manifest.modules) {
        for (const decl of mod.declarations) {
            const patchForClass = byClassName[decl.name];
            if (!patchForClass)
                continue;
            applyAdditivePatch(pluginKind, pluginName, decl, patchForClass);
        }
    }
}
function sortManifest(modules, deprecatedLast) {
    const sortByName = (items, deprecatedLast = false) => {
        const getDeprecated = (item) => {
            return "deprecated" in item && !!item.deprecated;
        };
        const sorted = [...items].sort((a, b) => {
            const aDeprecated = deprecatedLast && getDeprecated(a);
            const bDeprecated = deprecatedLast && getDeprecated(b);
            if (aDeprecated && !bDeprecated)
                return 1;
            if (!aDeprecated && bDeprecated)
                return -1;
            return a.name.localeCompare(b.name);
        });
        return sorted;
    };
    const sortByPath = (items) => {
        return [...items].sort((a, b) => a.path.localeCompare(b.path));
    };
    const sortedModules = sortByPath(modules);
    return sortedModules.map((mod) => {
        const sortedDeclarations = sortByName(mod.declarations ?? [], deprecatedLast);
        const sortedExports = sortByName(mod.exports ?? [], deprecatedLast);
        const sortedMod = {
            ...mod,
            declarations: sortedDeclarations,
            exports: sortedExports,
        };
        if (sortedMod.declarations) {
            sortedMod.declarations = sortedMod.declarations.map((decl) => {
                const sortedDecl = { ...decl };
                if (sortedDecl.members) {
                    sortedDecl.members = sortByName(sortedDecl.members, deprecatedLast);
                }
                if (sortedDecl.attributes) {
                    sortedDecl.attributes = sortByName(sortedDecl.attributes, deprecatedLast);
                }
                if (sortedDecl.events) {
                    sortedDecl.events = sortByName(sortedDecl.events, deprecatedLast);
                }
                if (sortedDecl.slots) {
                    sortedDecl.slots = sortByName(sortedDecl.slots, deprecatedLast);
                }
                if (sortedDecl.cssProperties) {
                    sortedDecl.cssProperties = sortByName(sortedDecl.cssProperties, deprecatedLast);
                }
                if (sortedDecl.cssParts) {
                    sortedDecl.cssParts = sortByName(sortedDecl.cssParts, deprecatedLast);
                }
                if (sortedDecl.cssStates) {
                    sortedDecl.cssStates = sortByName(sortedDecl.cssStates, deprecatedLast);
                }
                return sortedDecl;
            });
        }
        return sortedMod;
    });
}
/** Parses a custom tag's raw text into structured metadata for emission. */
function toCustomTagValue(text) {
    const parsed = parseCustomTagValue(text);
    const out = {};
    if (parsed?.name !== undefined)
        out.name = parsed.name;
    if (parsed?.description !== undefined)
        out.description = parsed.description;
    if (parsed?.default !== undefined)
        out.default = parsed.default;
    if (parsed?.type !== undefined)
        out.type = { text: parsed.type };
    return out;
}
/**
 * Groups custom tags by their output property name (honoring `mappedName`),
 * collecting repeated tags into an array (honoring `isArray` and repeat
 * occurrences). Keys that collide with fields already present in `existing`
 * are skipped.
 */
function toCustomTagFields(customJsDocTags, config, existing) {
    const grouped = new Map();
    for (const tag of customJsDocTags ?? []) {
        const option = config[tag.name];
        const key = option?.mappedName ?? tag.name;
        if (!key)
            continue;
        if (existing && Object.prototype.hasOwnProperty.call(existing, key))
            continue;
        const value = toCustomTagValue(tag.text);
        const current = grouped.get(key);
        if (current === undefined) {
            grouped.set(key, option?.isArray ? [value] : value);
        }
        else {
            grouped.set(key, [...(Array.isArray(current) ? current : [current]), value]);
        }
    }
    return Object.fromEntries(grouped);
}
function toCemPackage(internal, options = {
    sort: false,
    deprecatedLast: false,
}) {
    let modules = internal.modules.map((mod) => {
        const declarations = mod.declarations.map((decl) => toCustomElementDeclaration(decl, options.customJsDocTags));
        const jsExports = mod.declarations
            .filter((decl) => !!asString(decl.exportName))
            .map((decl) => ({
            kind: "js",
            name: asString(decl.exportName),
            declaration: { name: decl.name, module: mod.path },
        }));
        const module = {
            kind: "javascript-module",
            ...(mod.source ? { source: mod.source } : {}),
            ...(mod.typeDefinitionPath ? { typeDefinitionPath: mod.typeDefinitionPath } : {}),
            path: mod.path,
            declarations,
            exports: [
                ...jsExports,
                ...declarations
                    .filter((decl) => !!decl.tagName)
                    .map((decl) => ({
                    kind: "custom-element-definition",
                    name: decl.tagName,
                    declaration: { name: decl.name, module: mod.path },
                })),
            ],
        };
        return module;
    });
    rewriteKnownModuleReferences(modules, internal);
    if (options.definitionPathTemplate) {
        const definitionModules = [];
        for (const mod of internal.modules) {
            for (const declaration of mod.declarations.filter((item) => item.tagName && !options.excludedNames?.has(item.name))) {
                const definitionPath = normalizeModulePath(options.definitionPathTemplate(mod.source ?? mod.path, declaration.name, declaration.tagName));
                definitionModules.push({
                    kind: "javascript-module",
                    path: definitionPath,
                    declarations: [],
                    exports: [
                        {
                            kind: "custom-element-definition",
                            name: declaration.tagName,
                            declaration: { name: declaration.name, module: mod.path },
                        },
                    ],
                });
            }
        }
        modules = [...modules, ...definitionModules];
    }
    if (options.sort) {
        modules = sortManifest(modules, options.deprecatedLast);
    }
    return {
        schemaVersion: TARGET_CEM_SCHEMA_VERSION,
        modules,
    };
}
function rewriteKnownModuleReferences(modules, internal) {
    const paths = new Map();
    for (const module of internal.modules) {
        if (!module.source)
            continue;
        paths.set(module.source, module.path);
        paths.set(toPosixPath(module.source), module.path);
    }
    for (const module of modules) {
        rewriteModuleReferences(module.declarations, paths);
        rewriteModuleReferences(module.exports, paths);
    }
}
function rewriteModuleReferences(value, paths) {
    if (Array.isArray(value)) {
        for (const item of value)
            rewriteModuleReferences(item, paths);
        return;
    }
    if (!value || typeof value !== "object")
        return;
    const record = value;
    if (typeof record.module === "string") {
        const resolved = paths.get(record.module) ?? paths.get(toPosixPath(record.module));
        if (resolved)
            record.module = resolved;
    }
    for (const nested of Object.values(record))
        rewriteModuleReferences(nested, paths);
}
function toCustomElementDeclaration(fragment, customJsDocTagsConfig) {
    const known = {
        kind: asString(fragment.kind) ?? "class",
        customElement: typeof fragment.customElement === "boolean" ? fragment.customElement : true,
        name: fragment.name,
        description: asString(fragment.description),
        summary: asString(fragment.summary),
        deprecated: asDeprecated(fragment.deprecated),
        tagName: asString(fragment.tagName),
        superclass: fragment.superclass
            ? {
                name: fragment.superclass.name,
                module: asString(fragment.superclass.module),
            }
            : undefined,
        members: toMembers(fragment, customJsDocTagsConfig),
        attributes: toAttributes(fragment.attributes),
        events: toEvents(fragment.events),
        slots: toSlots(fragment.slots),
        cssProperties: toCssProperties(fragment.cssProperties),
        cssParts: toCssParts(fragment.cssParts),
        cssStates: toCssStates(fragment.cssStates),
        ...(Array.isArray(fragment.parameters) ? { parameters: fragment.parameters } : {}),
    };
    const extraFields = Object.fromEntries(Object.entries(fragment).filter(([key]) => ![
        "name",
        "kind",
        "customElement",
        "module",
        "exportName",
        "tagName",
        "summary",
        "deprecated",
        "superclass",
        "members",
        "attributes",
        "cssProperties",
        "cssParts",
        "cssStates",
        "slots",
        "events",
        "parameters",
        "description",
        "customJsDocTags",
        "omitInherited",
    ].includes(key)));
    const customTagFields = customJsDocTagsConfig
        ? toCustomTagFields(fragment.customJsDocTags, customJsDocTagsConfig, { ...known, ...extraFields })
        : {};
    return {
        ...known,
        ...extraFields,
        ...customTagFields,
    };
}
function toMembers(fragment, customJsDocTagsConfig) {
    if (!fragment.members?.length)
        return undefined;
    const converted = fragment.members
        .map((member) => {
        const kind = asString(member.kind) === "method" ? "method" : "field";
        if (kind === "method") {
            const method = {
                kind: "method",
                name: member.name,
                description: asString(member.description),
                summary: asString(member.summary),
                deprecated: asDeprecated(member.deprecated),
                privacy: asPrivacy(member.privacy),
                static: asBoolean(member.static),
                parameters: toParameters(member.parameters),
                return: toMethodReturn(member.return),
                ...(member.inheritedFrom
                    ? { inheritedFrom: member.inheritedFrom }
                    : {}),
                ...(toType(member.parsedType)
                    ? {
                        parsedType: toType(member.parsedType),
                    }
                    : {}),
            };
            if (customJsDocTagsConfig) {
                Object.assign(method, toCustomTagFields(member.customJsDocTags, customJsDocTagsConfig, method));
            }
            return method;
        }
        const field = {
            kind: "field",
            name: member.name,
            description: asString(member.description),
            summary: asString(member.summary),
            deprecated: asDeprecated(member.deprecated),
            privacy: asPrivacy(member.privacy),
            static: asBoolean(member.static),
            readonly: asBoolean(member.readonly),
            default: asString(member.default),
            attribute: asString(member.attribute),
            reflects: asBoolean(member.reflects),
            internal: asBoolean(member.internal),
            ...(member.inheritedFrom
                ? { inheritedFrom: member.inheritedFrom }
                : {}),
            type: toType(member.type),
            ...(toType(member.parsedType)
                ? {
                    parsedType: toType(member.parsedType),
                }
                : {}),
        };
        if (customJsDocTagsConfig) {
            Object.assign(field, toCustomTagFields(member.customJsDocTags, customJsDocTagsConfig, field));
        }
        return field;
    })
        .filter(Boolean);
    return converted.length ? converted : undefined;
}
function toAttributes(attributes) {
    if (!attributes?.length)
        return undefined;
    const converted = attributes
        .map((attr) => ({
        name: attr.name,
        description: asString(attr.description),
        summary: asString(attr.summary),
        deprecated: asDeprecated(attr.deprecated),
        type: toType(attr.type),
        ...(toType(attr.parsedType)
            ? {
                parsedType: toType(attr.parsedType),
            }
            : {}),
        default: asString(attr.default),
        fieldName: asString(attr.fieldName),
        ...inheritedFrom(attr),
    }))
        .filter((attr) => !!attr.name);
    return converted.length ? converted : undefined;
}
function toEvents(events) {
    if (!events?.length)
        return undefined;
    const converted = events
        .map((event) => ({
        name: event.name,
        description: asString(event.description),
        summary: asString(event.summary),
        deprecated: asDeprecated(event.deprecated),
        type: toType(event.type) ?? { text: "Event" },
        ...(toType(event.detail)
            ? {
                detail: toType(event.detail),
            }
            : {}),
        ...(toType(event.parsedType)
            ? {
                parsedType: toType(event.parsedType),
            }
            : {}),
        ...inheritedFrom(event),
    }))
        .filter((event) => !!event.name);
    return converted.length ? converted : undefined;
}
function toSlots(slots) {
    if (!slots?.length)
        return undefined;
    const converted = slots.map((slot) => ({
        name: slot.name,
        description: asString(slot.description),
        summary: asString(slot.summary),
        deprecated: asDeprecated(slot.deprecated),
        ...inheritedFrom(slot),
    }));
    return converted.length ? converted : undefined;
}
function toCssProperties(cssProperties) {
    if (!cssProperties?.length)
        return undefined;
    const converted = cssProperties.map((prop) => ({
        name: prop.name,
        description: asString(prop.description),
        summary: asString(prop.summary),
        deprecated: asDeprecated(prop.deprecated),
        default: asString(prop.default),
        syntax: asString(prop.syntax),
        ...inheritedFrom(prop),
    }));
    return converted.length ? converted : undefined;
}
function toCssParts(cssParts) {
    if (!cssParts?.length)
        return undefined;
    const converted = cssParts.map((part) => ({
        name: part.name,
        description: asString(part.description),
        summary: asString(part.summary),
        deprecated: asDeprecated(part.deprecated),
        ...inheritedFrom(part),
    }));
    return converted.length ? converted : undefined;
}
function toCssStates(cssStates) {
    if (!cssStates?.length)
        return undefined;
    const converted = cssStates.map((state) => ({
        name: state.name,
        description: asString(state.description),
        summary: asString(state.summary),
        deprecated: asDeprecated(state.deprecated),
        ...inheritedFrom(state),
    }));
    return converted.length ? converted : undefined;
}
function toType(value) {
    const text = asString(value);
    return text ? { text } : undefined;
}
function inheritedFrom(value) {
    const source = value;
    return source.inheritedFrom ? { inheritedFrom: source.inheritedFrom } : {};
}
function asString(value) {
    return typeof value === "string" && value.length > 0 ? value : undefined;
}
function asBoolean(value) {
    return typeof value === "boolean" ? value : undefined;
}
function asDeprecated(value) {
    if (typeof value === "boolean")
        return value;
    if (typeof value === "string" && value.length > 0)
        return value;
    return undefined;
}
function asPrivacy(value) {
    return value === "public" || value === "private" || value === "protected" ? value : undefined;
}
function toParameters(params) {
    if (!Array.isArray(params) || params.length === 0)
        return undefined;
    const converted = [];
    for (const p of params) {
        const rec = p;
        const name = asString(rec.name);
        if (!name)
            continue;
        converted.push({
            name,
            type: toType(rec.type),
            ...(toType(rec.parsedType)
                ? {
                    parsedType: toType(rec.parsedType),
                }
                : {}),
            optional: asBoolean(rec.optional),
            rest: asBoolean(rec.rest),
            default: asString(rec.default),
        });
    }
    return converted.length ? converted : undefined;
}
function toMethodReturn(value) {
    if (!value || typeof value !== "object")
        return undefined;
    const rec = value;
    const type = toType(rec.type);
    const description = asString(rec.description);
    const parsedType = toType(rec.parsedType);
    if (!type && !description && !parsedType)
        return undefined;
    return {
        type,
        ...(parsedType ? { parsedType: parsedType } : {}),
        description,
    };
}
function applyAdditivePatch(pluginKind, pluginName, decl, patchForClass) {
    for (const [field, value] of Object.entries(patchForClass)) {
        if (field in decl) {
            throw new Error(`${pluginKind} plugin "${pluginName}" attempted to overwrite existing field ` +
                `"${field}" on "${decl.name}". Patches may only add new fields.`);
        }
        decl[field] = value;
    }
}
