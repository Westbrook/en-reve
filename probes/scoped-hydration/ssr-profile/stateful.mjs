import {html} from 'lit';
export const version='stateful',definitions=[];
let invocations=0;
export function template({message}) {return html`<p>Invocation ${++invocations}: ${message}</p>`;}
