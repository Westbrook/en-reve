export const testHarnessVariables: readonly string[];
export const coordinationVariables: readonly string[];
export function setupEnvironment(environment?: Record<string,string|undefined>, options?: {production?: boolean}): Record<string,string|undefined>;
export function setupEnvironmentInputs(environment: Record<string,string|undefined>): Record<string,string|undefined>;
