import '@lit-labs/ssr-client/lit-element-hydrate-support.js';
import { hydrate } from '@lit-labs/ssr-client';
import { fixtureTemplate, registerFixture } from './fixture.mjs';
export async function start() {
  registerFixture(); hydrate(fixtureTemplate(),document.querySelector('#fixture'));
  const settle = async () => {
    for(let n=0;n<3;n++) await Promise.all([...document.querySelectorAll('#fixture *')].map(node=>node.updateComplete));
  };
  const frames = async (n=3) => { for(let i=0;i<n;i++) await new Promise(requestAnimationFrame); };
  const surface = id => document.getElementById(id).shadowRoot.querySelector(id==='combobox'?'[part="popup"]':'[part~="surface"]');
  const shown = node => node.localName==='dialog' ? node.open : node.matches(':popover-open');
  const open = async id => {
    if(id==='combobox') {
      const host=document.getElementById(id);
      host.shadowRoot.querySelector('input').focus();
      if(!shown(surface(id))) host.shadowRoot.querySelector('[part="trigger"]').click();
    } else {
      document.getElementById(`${id}-trigger`).focus(); document.getElementById(id).show();
    }
    await settle();await frames();
  };
  const close = async id => {
    if(id==='combobox') document.getElementById(id).shadowRoot.querySelector('input').dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
    else document.getElementById(id).hide();
    await settle(); await frames(1);
  };
  const info = id => {
    const node=surface(id),css=getComputedStyle(node),box=node.getBoundingClientRect();
    return {shown:shown(node),inert:node.inert,display:css.display,opacity:Number(css.opacity),translate:css.translate,scale:css.scale,
      modal:node.matches(':modal'),box:[box.x,box.y,box.width,box.height],
      animations:node.getAnimations().map(animation=>({state:animation.playState,duration:animation.effect.getTiming().duration,property:animation.transitionProperty??animation.animationName})),
      activeInside:node.matches(':focus-within')};
  };
  window.motion={settle,frames,surface,shown,open,close,info};
  await settle();document.documentElement.dataset.hydrated='true';
}
