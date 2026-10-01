export function contentInventory(root: string, paths: string[], exclude?: (name: string) => boolean, followLinks?: boolean, options?: {includeModes?: boolean; digestFile?: (path: string) => Promise<string>}): Promise<Record<string, unknown>>;
export function inventoryDigest(value: unknown): string;
export function atomicJSON(path: string, value: unknown): Promise<void>;
export function immutable<T>(value: T): T;
