import '@lit-labs/ssr/lib/install-global-dom-shim.js';
import test from 'node:test';
import assert from 'node:assert/strict';
const {html}=await import('lit');
const {renderToString}=await import('../dist/index.js');
await import('@en-reve/elements/define/chat-message.js');
await import('@en-reve/elements/define/chat-composer.js');
await import('@en-reve/elements/define/textarea.js');
test('chat initial HTML preserves authored message semantics and slotted draft ownership',async()=>{
 const output=await renderToString(html`<en-chat-message author="Mira"><span>A readable message</span><time slot="metadata">Today</time><button slot="actions">Reply</button></en-chat-message><en-chat-composer sending><en-textarea slot="editor" label="Draft" value="Keep this draft"></en-textarea><p slot="status">Waiting</p></en-chat-composer>`);
 assert.match(output,/aria-label="Mira"/);assert.match(output,/A readable message/);assert.match(output,/slot="metadata"/);assert.match(output,/Keep this draft/);assert.match(output,/part="editor"/);assert.match(output,/aria-label="Message composer"/);assert.match(output,/disabled/);
});
test('SSR marks a supplied send action and hides only the fallback control',async()=>{
 const output=await renderToString(html`<en-chat-composer><textarea slot="editor">Draft</textarea><button slot="send">Submit draft</button></en-chat-composer>`);
 assert.match(output,/data-en-optional-slots=/);assert.match(output,/<en-button(?=[^>]*data-en-slot-fallback)(?=[^>]*\shidden(?:\s|=|>))[^>]*>/);assert.match(output,/<button slot="send">Submit draft<\/button>/);
 const defaultOutput=await renderToString(html`<en-chat-composer><textarea slot="editor">Draft</textarea></en-chat-composer>`);
 assert.doesNotMatch(defaultOutput,/<en-button(?=[^>]*data-en-slot-fallback)(?=[^>]*\shidden(?:\s|=|>))[^>]*>/);
});
