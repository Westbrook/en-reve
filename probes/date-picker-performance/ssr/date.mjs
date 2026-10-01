import {html} from 'lit';
import {datePickerShellDefinition} from '@en-reve/elements/date-picker-shell.js';
export const version='phase6-date-v1';
export const definitions=[datePickerShellDefinition];
export const template=()=>html`<form><en-date-picker calendar-loading="deferred" label="Event date" name="eventDate" value="2026-09-15" today="2026-09-22" min="2026-01-01" max="2026-12-31" required></en-date-picker></form>`;
export async function ready(root){await root.querySelector('en-date-picker').updateComplete;}
