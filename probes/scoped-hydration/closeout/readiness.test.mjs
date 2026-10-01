import {test} from 'node:test';
import assert from 'node:assert/strict';
import {settleBeforeFocus} from '../production/settle-before-focus.mjs';
function fixture(){
 let next=1;const callbacks=new Map();
 const view={requestAnimationFrame(fn){const id=next++;callbacks.set(id,fn);return id;},cancelAnimationFrame(id){callbacks.delete(id);}};
 const document={defaultView:view},root={isConnected:true,ownerDocument:document};
 return {root,callbacks,tick(){const current=[...callbacks.values()];callbacks.clear();for(const fn of current)fn();}};
}
test('does not declare focus readiness before a rendering opportunity',async()=>{const f=fixture();let ready=false;const p=settleBeforeFocus(f.root).then(()=>ready=true);await Promise.resolve();assert.equal(ready,false);f.tick();await Promise.resolve();assert.equal(ready,false);f.tick();await p;assert.equal(ready,true);assert.equal(f.callbacks.size,0);});
test('cancellation while frames are suspended rejects and releases scheduled work',async()=>{const f=fixture(),controller=new AbortController(),p=settleBeforeFocus(f.root,controller.signal);controller.abort();await assert.rejects(p,{name:'AbortError'});assert.equal(f.callbacks.size,0);f.tick();});
test('already aborted requests never schedule a frame',async()=>{const f=fixture(),controller=new AbortController();controller.abort();await assert.rejects(settleBeforeFocus(f.root,controller.signal),{name:'AbortError'});assert.equal(f.callbacks.size,0);});
for(const movement of ['disconnect','adopt'])test(`a ${movement} cannot complete pending readiness`,async()=>{const f=fixture(),p=settleBeforeFocus(f.root);f.tick();if(movement==='disconnect')f.root.isConnected=false;else f.root.ownerDocument={defaultView:f.root.ownerDocument.defaultView};f.tick();await assert.rejects(p,{name:'AbortError'});assert.equal(f.callbacks.size,0);});
