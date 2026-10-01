import {LitElement,html} from 'lit';
export const version='two';
class ScopedMessage extends LitElement { static properties={message:{}};constructor(){super();this.message='';}render(){return html`<p>Version two: ${this.message}</p>`;} }
export const definitions=[{tagName:'test-scoped-message',elementClass:ScopedMessage}];
export function template(snapshot){return html`<test-scoped-message .message=${snapshot.message}></test-scoped-message>`;}
export async function ready(root){await root.querySelector('test-scoped-message').updateComplete;}
