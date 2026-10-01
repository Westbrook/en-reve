export function immutableSetup(options: {cache: string; inputs: unknown; produce: (directory: string) => Promise<void>; verifyInputs?: () => Promise<unknown>; timeoutMs?: number}): Promise<{directory: string; reused: boolean; originatingProducer: string; key: string}>;

export function lookupImmutableSetup(options: {cache: string; inputs: unknown}): Promise<{directory: string; reused: true; originatingProducer: string; key: string} | null>;
