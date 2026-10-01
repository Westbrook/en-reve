import {createContext} from '@lit/context';
import type {TooltipWarmupGroup} from './warmup-group.js';

/** Nearest trigger-ancestor scope. Explicit warmup-group IDs always take precedence. */
export const tooltipWarmupContext = createContext<TooltipWarmupGroup | undefined>('@en-reve/tooltip-warmup/v1');
export {createTooltipWarmupGroup} from './warmup-group.js';
export type {TooltipWarmupGroup} from './warmup-group.js';
