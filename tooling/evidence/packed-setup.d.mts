export interface PreparedArchive { name: string; filename: string; integrity: string; shasum: string; setup: { key: string; reused: boolean; originatingProducer: unknown }; }
export function preparedPackages(requested: string[], destination: string): Promise<PreparedArchive[]>;
