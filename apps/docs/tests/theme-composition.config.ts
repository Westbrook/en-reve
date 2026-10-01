import { pipelineOutput } from '../../../tooling/test-pipeline/config-output.mjs';
import {defineConfig} from '@playwright/test';
import base from './playwright.config.js';
export default defineConfig(base,{testMatch:['theme-composition.spec.ts','calendar.spec.ts','date-ranges.spec.ts','color-picker.spec.ts','color-plane-editors.spec.ts','rich-text.spec.ts','editor-geometry.spec.ts','data-table.spec.ts','time-field.spec.ts','form-navigation.spec.ts']}, pipelineOutput(import.meta.url));
