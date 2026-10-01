import { pipelineOutput } from '../../../tooling/test-pipeline/config-output.mjs';
import {defineConfig} from '@playwright/test';
import base from './playwright.config.js';
export default defineConfig({
  forbidOnly: true,...base,testMatch:'press-families.spec.ts',workers:3,timeout:90_000,
 outputDir:'../../../artifacts/button-like-expansion/browser',reporter:[['list'],['json',{outputFile:new URL('../../../artifacts/button-like-expansion/browser.json',import.meta.url).pathname}]],
 use:{...base.use,baseURL:process.env.EN_DOCS_ORIGIN??'http://127.0.0.1:4480',reducedMotion:'no-preference'},webServer:undefined}, pipelineOutput(import.meta.url));
