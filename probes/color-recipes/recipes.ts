import {LitElement,html,css} from 'lit';
import * as rootStyles from '@en-reve/styles';
import * as explicitStyles from '@en-reve/styles/index.js';
import {styleFamilies,styleOverrideNames,styleStateProperties} from '@en-reve/styles/metadata.js';
import {colorSliderStyles} from '@en-reve/styles/color-slider.js';
import {colorWheelStyles} from '@en-reve/styles/color-wheel.js';
import {colorPickerStyles,colorPlaneStyles} from '@en-reve/styles/color-picker.js';
const portable=new URL(location.href).searchParams.get('delivery')==='css';
const shared=[rootStyles.foundationStyles,explicitStyles.controlStyles,explicitStyles.formStyles,rootStyles.buttonStyles];
const sheet=(name:string)=>portable?html`<link rel="stylesheet" href=${'/'+name+'.css'}>`:null;
const clamp=(n:number,min=0,max=100)=>Math.max(min,Math.min(max,n));
class NativeChannel extends LitElement{
 static override properties={value:{type:Number},label:{type:String},disabled:{type:Boolean,reflect:true}};
 static override styles=[...(portable?[]:[...shared,colorSliderStyles]),css`:host{display:block}.en-range{appearance:none;background:transparent}.en-range::-webkit-slider-thumb{appearance:none}`];
 declare value:number;declare label:string;declare disabled:boolean;
 constructor(){super();this.value=50;this.label='Opacity';this.disabled=false;}
 private change(e:Event){this.value=Number((e.target as HTMLInputElement).value);this.dispatchEvent(new CustomEvent('channel-input',{detail:this.value,bubbles:true,composed:true}));}
 protected override render(){return html`${sheet('color-slider')}<div class="en-foundation en-field"><label class="en-label" for="channel">${this.label}</label><div class="en-range-row"><input id="channel" class="en-range" type="range" min="0" max="100" step="1" .value=${String(this.value)} ?disabled=${this.disabled} @input=${this.change}><output for="channel">${this.value}</output></div></div>`;}
}
customElements.define('native-channel',NativeChannel);
class NativeWheel extends LitElement{
 static override properties={value:{type:Number},disabled:{type:Boolean,reflect:true}};
 static override styles=[...(portable?[]:[...shared,colorWheelStyles]),css`:host{display:block}[part=ring]{background:conic-gradient(red,#ff0,lime,cyan,blue,magenta,red)}`];
 declare value:number;declare disabled:boolean;private original=0;
 constructor(){super();this.value=0;this.disabled=false;}
 private set(n:number){this.value=((Math.round(n)%360)+360)%360;this.requestUpdate();}
 private key(e:KeyboardEvent){if(this.disabled)return;const delta=e.shiftKey?10:1;const next:Record<string,number>={ArrowRight:this.value+delta,ArrowUp:this.value+delta,ArrowLeft:this.value-delta,ArrowDown:this.value-delta,Home:0,End:359,PageUp:this.value+10,PageDown:this.value-10};if(e.key in next){e.preventDefault();this.set(next[e.key]!);}}
 private point(e:PointerEvent){const n=e.currentTarget as HTMLElement,b=n.getBoundingClientRect();this.set(Math.atan2(e.clientX-b.left-b.width/2,-(e.clientY-b.top-b.height/2))*180/Math.PI);}
 protected override render(){return html`${sheet('color-wheel')}<div class="en-foundation" part="base"><span id="label" part="label">Hue wheel</span><output>${this.value}°</output><div part="control" role="slider" tabindex=${this.disabled?-1:0} aria-labelledby="label" aria-valuemin="0" aria-valuemax="359" aria-valuenow=${this.value} aria-valuetext=${this.value+' degrees'} aria-disabled=${String(this.disabled)} @keydown=${this.key} @pointerdown=${(e:PointerEvent)=>{if(this.disabled)return;this.original=this.value;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);(e.currentTarget as HTMLElement).focus();this.point(e);}} @pointermove=${(e:PointerEvent)=>{if(!this.disabled&&(e.currentTarget as HTMLElement).hasPointerCapture(e.pointerId))this.point(e);}} @pointerup=${(e:PointerEvent)=>{const n=e.currentTarget as HTMLElement;if(n.hasPointerCapture(e.pointerId))n.releasePointerCapture(e.pointerId);}} @pointercancel=${()=>this.set(this.original)}><span part="ring"></span><span part="center"></span><span class="arm" style=${'--_en-wheel-angle:'+this.value+'deg;--_en-wheel-thumb:hsl('+this.value+' 100% 50%)'}><span part="thumb"></span></span></div></div>`;}
}
customElements.define('native-wheel',NativeWheel);
class NativePlane extends LitElement{
 static override properties={saturation:{type:Number},brightness:{type:Number},disabled:{type:Boolean,reflect:true}};
 static override styles=[...(portable?[]:[...shared,colorPlaneStyles]),css`:host{display:block}[part=channels] label{display:grid;gap:4px}input{inline-size:100%}`];
 declare saturation:number;declare brightness:number;declare disabled:boolean;private original=[50,50];
 constructor(){super();this.saturation=50;this.brightness=50;this.disabled=false;}
 private point(e:PointerEvent){const n=e.currentTarget as HTMLElement,r=n.getBoundingClientRect(),x=(e.clientX-r.left)/r.width;this.saturation=Math.round(clamp((getComputedStyle(this).direction==='rtl'?1-x:x)*100));this.brightness=Math.round(clamp((1-(e.clientY-r.top)/r.height)*100));}
 protected override render(){return html`${sheet('color-plane')}<div class="en-foundation" part="base" role="group" aria-label="Color plane"><div part="plane" aria-hidden="true" style=${'--_en-plane-gradient:linear-gradient(to right,white,blue);--_en-plane-fallback:linear-gradient(to right,white,blue);--_en-plane-x:'+this.saturation+'%;--_en-plane-y:'+(100-this.brightness)+'%'} @pointerdown=${(e:PointerEvent)=>{if(this.disabled)return;this.original=[this.saturation,this.brightness];(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);this.point(e);}} @pointermove=${(e:PointerEvent)=>{if(!this.disabled&&(e.currentTarget as HTMLElement).hasPointerCapture(e.pointerId))this.point(e);}} @pointerup=${(e:PointerEvent)=>{const n=e.currentTarget as HTMLElement;if(n.hasPointerCapture(e.pointerId))n.releasePointerCapture(e.pointerId);}} @pointercancel=${()=>{[this.saturation,this.brightness]=this.original as [number,number];}}><span part="thumb"></span></div><p part="axes">Saturation horizontally; brightness vertically. Use the named sliders for keyboard input.</p><div part="channels">${(['Saturation','Brightness'] as const).map((name,i)=>html`<label>${name}<input type="range" min="0" max="100" .value=${String(i?this.brightness:this.saturation)} ?disabled=${this.disabled} @input=${(e:Event)=>{const v=Number((e.target as HTMLInputElement).value);if(i)this.brightness=v;else this.saturation=v;}}><output>${i?this.brightness:this.saturation}%</output></label>`)}</div><p part="error" role="status"></p></div>`;}
}
customElements.define('native-plane',NativePlane);
class NativePicker extends LitElement{
 static override styles=[...(portable?[]:[...shared,colorPickerStyles]),css`:host{display:block}native-channel{min-inline-size:0}`];
 alpha=50;format='hex';error='';color='#5577cc';
 private updateColor(e:Event){const n=e.target as HTMLInputElement;if(!/^#[0-9a-f]{6}$/i.test(n.value)){this.error='Use six hex digits';n.setCustomValidity(this.error);}else{this.color=n.value;this.error='';n.setCustomValidity('');}this.requestUpdate();}
 protected override render(){const rgb=[1,3,5].map(n=>parseInt(this.color.slice(n,n+2),16));const value=this.format==='hex'?this.color+Math.round(this.alpha/100*255).toString(16).padStart(2,'0'):`rgb(${rgb.join(' ')} / ${this.alpha/100})`;return html`${sheet('color-picker')}<section class="en-foundation" part="base" role="group" aria-label="Color picker"><div class="summary" part="summary"><span class="preview-frame"><span part="preview" style=${'background:rgb('+rgb.join(' ')+' / '+this.alpha/100+')'}></span></span><label part="hex-field" class="en-label" for="hex">Hex color<input id="hex" class="en-input" value="#5577cc" aria-describedby="error" @input=${this.updateColor}></label></div><div part="formats"><label part="format">Output format<select class="en-select" @change=${(e:Event)=>{this.format=(e.target as HTMLSelectElement).value;this.requestUpdate();}}><option value="hex">HEX</option><option value="rgb">RGB</option></select></label></div><div part="channels"><native-channel part="channel" checkerboard label="Alpha" .value=${this.alpha} style=${'--_en-color-gradient:linear-gradient(to right,transparent,'+this.color+');--_en-color-gradient-fallback:linear-gradient(to right,transparent,'+this.color+');--_en-color-gradient-rtl:linear-gradient(to left,transparent,'+this.color+');--_en-color-gradient-fallback-rtl:linear-gradient(to left,transparent,'+this.color+')'} @channel-input=${(e:CustomEvent)=>{this.alpha=e.detail;this.requestUpdate();}}></native-channel></div><output part="value" aria-label="Serialized color">${value}</output><p part="error" id="error" ?data-invalid=${!!this.error} role="status">${this.error}</p></section>`;}
}
customElements.define('native-picker',NativePicker);
class ThemeInspector extends LitElement{
 static override styles=[...shared,rootStyles.surfaceStyles,explicitStyles.layoutStyles];
 private name='--en-control-radius';private applied=false;
 protected override render(){return html`<section class="en-card en-foundation"><h2>Metadata-driven customization</h2><label class="en-label" for="hook">Style override</label><select class="en-select" id="hook" .value=${this.name} @change=${(e:Event)=>this.name=(e.target as HTMLSelectElement).value}>${styleOverrideNames.filter(n=>['--en-control-radius','--en-control-background','--en-color-wheel-size'].includes(n)).map(n=>html`<option value=${n}>${n}</option>`)}</select><button class="en-button" @click=${()=>{const target=document.querySelector<HTMLElement>('native-picker')!;target.style.setProperty(this.name,this.name.includes('background')?'rgb(20, 30, 40)':'16px');this.applied=true;this.requestUpdate();}}>Apply scoped override</button><p role="status">${this.applied?'Applied '+this.name:styleFamilies.length+' style families'}</p><p>Mechanical inputs are separate: ${styleStateProperties.length}</p></section>`;}
}
customElements.define('theme-inspector',ThemeInspector);
Object.assign(window,{styleExports:{root:rootStyles,explicit:explicitStyles,metadata:{styleFamilies,styleOverrideNames,styleStateProperties}}});
