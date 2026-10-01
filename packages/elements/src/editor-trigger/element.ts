import { EditorAssociation } from '../internal/editor-association.js';
import { editorExtensionContext, isEditorExtensionHost } from '../editor/context.js';
import {html,type PropertyValues} from 'lit';
import {EnElement} from '../internal/en-element.js';
import type {EditorExtensionHost,EditorExtension} from '../editor/extensions.js';
/**
 * Optional declarative extension registration. Picker behavior is supplied through extension.
 * @tagname en-editor-trigger
 */
export class EnEditorTrigger extends EnElement {
 static override properties={for:{reflect:true},editor:{attribute:false},extension:{attribute:false},disabled:{type:Boolean,reflect:true}};
 /** Same-tree editor ID. Use editor for an explicit cross-root reference. */
 declare for:string;
 /** Optional explicit editor element. */
 declare editor:EditorExtensionHost|undefined;
 /** Application-defined trigger, data provider and/or picker renderer. */
 declare extension:EditorExtension|undefined;
 declare disabled:boolean;
 private dispose?:()=>void;private bound?:EditorExtensionHost;private configured?:EditorExtension;
 constructor(){super();this.for='';this.disabled=false;}
 override connectedCallback(){super.connectedCallback();this.bind();}
 override disconnectedCallback(){this.dispose?.();this.dispose=undefined;this.bound=undefined;super.disconnectedCallback();}
 protected override updated(_changed:PropertyValues){this.association.refresh();this.bind();}
 private target?:EditorExtensionHost;
 private readonly association=new EditorAssociation(this,editorExtensionContext,isEditorExtensionHost,target=>{this.target=target;this.bind();});
 private bind(){const target=this.target;if(this.bound===target&&this.configured===this.extension&&!!this.dispose===!!(!this.disabled&&target&&this.extension))return;this.dispose?.();this.dispose=undefined;this.bound=target;this.configured=this.extension;if(!this.disabled&&target&&this.extension)this.dispose=target.registerExtension(this.extension);}
 protected override render(){return html``;}
}
declare global {interface HTMLElementTagNameMap {'en-editor-trigger':EnEditorTrigger;}}
