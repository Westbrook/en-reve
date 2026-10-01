import {html, render, css} from 'lit';
import {createElementScope, elementScopeCapabilities} from '@en-reve/elements/element-scope.js';
import {EnElement} from '@en-reve/elements/element.js';
import {definitions} from '@en-reve/elements/catalog.js';
import {ChildUpgrades} from '@en-reve/elements/internal/child-upgrades.js';
Object.assign(window, {ownershipTest: {html, render, css, createElementScope, elementScopeCapabilities, EnElement, ChildUpgrades, definitions: Object.fromEntries(definitions.map(definition => [definition.tagName, definition]))}});
