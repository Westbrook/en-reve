import { pipelineOutput } from '../../../tooling/test-pipeline/config-output.mjs';
import {defineConfig} from '@playwright/test';
import base from './playwright.config.js';
export default defineConfig({
  forbidOnly: true,...base,testMatch:'theme-adoption.spec.ts',workers:3,timeout:180_000,
 outputDir:'../../../artifacts/theme-adoption/browser',reporter:[['list'],['json',{outputFile:new URL('../../../artifacts/theme-adoption/browser.json',import.meta.url).pathname}]],
 use:{...base.use,baseURL:process.env.EN_DOCS_ORIGIN??'http://127.0.0.1:4480'},webServer:undefined}, pipelineOutput(import.meta.url));
