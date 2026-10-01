export function generateAPIExamples(options: { workspaceRoot: string; docsRoot?: string }): Promise<{
	pages: Array<{id:string;title:string;file:string;path:string;tags:string[];definitions:string[]}>;
	changedFiles: string[];
}>;
