import '@lit-labs/ssr-client/lit-element-hydrate-support.js';
// Preview frames load their own entries; this document registers its editor controls.
import '@en-reve/elements/define/alert.js';
import '@en-reve/elements/define/badge.js';
import '@en-reve/elements/define/button.js';
import '@en-reve/elements/define/color-field.js';
import '@en-reve/elements/define/number-field.js';
import '@en-reve/elements/define/search-input.js';
import '@en-reve/elements/define/segmented-control.js';
import '@en-reve/elements/define/select.js';
import '@en-reve/elements/define/text-field.js';
import '@en-reve/elements/define/textarea.js';
import { ThemeReviewApp } from './app.js';
customElements.define('en-theme-review-app', ThemeReviewApp);
