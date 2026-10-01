export function generateAPIReference(options: { workspaceRoot: string; outputRoot?: string }): Promise<{
	components: number; manifestDigest: string; changedFiles: string[];
}>;
export function resolvePublicImport(exports: Record<string, unknown>, subpath: string): string;
export function exportsClass(manifest: { modules: unknown[] }, from: string, exportedName: string, expectedModule: string, className: string, visited?: Set<string>): boolean;

export function generateCandidateAPIReference(options: { workspaceRoot: string; bundleRoot: string; outputRoot: string }): Promise<{
	components: number; manifestDigest: string; changedFiles: string[];
}>;
