import type { PlaywrightTestConfig } from '@playwright/test';
export function pipelineOutput(configURL: string): Pick<PlaywrightTestConfig, 'outputDir' | 'reporter'>;
