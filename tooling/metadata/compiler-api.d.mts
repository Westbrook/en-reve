import ts from '@typescript/typescript6';
export {ts};
export interface CompilerPackageIdentity {name: string; version: string; packageDigest: string; entryDigest: string; distributionDigest?: string}
export interface CompilerIdentity {version: 1; apiVersion: string; wrapper: CompilerPackageIdentity; effective: CompilerPackageIdentity; boundaryDigest: string}
export function compilerIdentity(): CompilerIdentity;
export function compilerResolution(): {identity: CompilerIdentity; wrapperEntry: string; effectiveEntry: string; wrapperPackage: string; effectivePackage: string};
export function assertGeneratorCompilerOwners(): Record<string, CompilerPackageIdentity>;
export function resolveCompilerPackage(name: string, from?: ReturnType<typeof import('node:module').createRequire>): {entry: string; packagePath: string; metadata: any; identity: CompilerPackageIdentity};
