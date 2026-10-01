import {html, render, css} from 'lit';
import {createElementScope, elementScopeCapabilities, registryCreationScope} from '@en-reve/elements/element-scope.js';
import {EnElement} from '@en-reve/elements/internal/en-element.js';
import {datePickerDefinition} from '@en-reve/elements/definitions/date-picker.js';
import {datePickerShellDefinition} from '@en-reve/elements/date-picker-shell.js';
import {splitViewDefinition} from '@en-reve/elements/definitions/split-view.js';
Object.assign(window, {scopeTest: {html, render, css, createElementScope, elementScopeCapabilities, registryCreationScope, EnElement, datePickerDefinition, datePickerShellDefinition, splitViewDefinition}});
