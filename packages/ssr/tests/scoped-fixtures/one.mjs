import {LitElement,html,css} from 'lit';
import {buttonDefinition} from '@en-reve/elements/definitions/button.js';
export const version='one';
class ScopedMessage extends LitElement {
 static properties={message:{}};
 static styles=css`:host{display:block;color:rgb(21,90,60)}`;
 constructor(){super();this.message='';}
 render(){return html`<p>Version one: ${this.message}</p>`;}
}
export const definitions=[{tagName:'test-scoped-message',elementClass:ScopedMessage},buttonDefinition];
export function template(snapshot){return html`<form><label>Draft <input name="draft" value=${snapshot.message} required></label><button type="submit">Save</button></form><test-scoped-message .message=${snapshot.message}></test-scoped-message><en-button>Optional action</en-button>`;}
export async function ready(root){await Promise.all([...root.querySelectorAll('test-scoped-message,en-button')].map(el=>el.updateComplete));}
