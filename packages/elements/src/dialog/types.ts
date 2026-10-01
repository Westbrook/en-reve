import type { ChangeEvent } from '@en-reve/primitives/interactions/events.js';
export type OverlayReason = 'programmatic' | 'trigger' | 'close-button' | 'close-request' | 'escape' | 'back' | 'backdrop' | 'outside' | 'native-close' | 'hover' | 'focus' | 'action' | 'tab' | 'layout';
export type DialogClosedBy = 'any' | 'closerequest' | 'none';

export type OverlayChangeEvent = ChangeEvent<boolean, OverlayReason>;
export interface OverlayEventMap { 'en-change': OverlayChangeEvent; }
