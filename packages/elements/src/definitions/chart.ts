import type {ElementDefinition} from '@en-reve/primitives/interactions/registration.js';
import {EnChart} from '../chart.js';
export const chartDefinition = { tagName: 'en-chart', elementClass: EnChart } as const satisfies ElementDefinition;
