import {html} from 'lit';
import {settleBeforeFocus} from './settle-before-focus.mjs';
import {commandPaletteDefinition} from '@en-reve/elements/definitions/command-palette.js';
export const version='1';
export const definitions=[commandPaletteDefinition];
export function template(snapshot){return html`<en-command-palette label="Settings commands" .commands=${snapshot.commands}></en-command-palette>`;}
export async function ready(root,signal){
 await root.querySelector('en-command-palette').updateComplete;
 // Called once per hydration island; repeated openings use the existing ready state.
 await settleBeforeFocus(root,signal);
}
