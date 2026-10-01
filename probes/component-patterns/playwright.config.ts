import { pipelineOutput } from '../../tooling/test-pipeline/config-output.mjs';
import {defineConfig} from '@playwright/test';
export default defineConfig({
  forbidOnly: true,testDir:'.',testMatch:'*.spec.ts',fullyParallel:true,workers:3,timeout:60000,outputDir:'../../artifacts/component-gap-closure/gallery',reporter:[['list'],['json',{outputFile:'../../artifacts/component-gap-closure/gallery.json'}]],use:{baseURL:process.env.EN_PATTERN_GALLERY_URL ?? 'http://127.0.0.1:4480',browserName:'chromium',trace:'retain-on-failure'}}, pipelineOutput(import.meta.url));
