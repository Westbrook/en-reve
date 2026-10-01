import {decodeRichDocument,richDocumentFromRuns,richDocumentText,type RichDocumentLimits} from '@en-reve/elements/rich-document.js';
import {EnRichTextEditor,type RichRange,type RichRangeDecoration,type RichRangeReplacement} from '@en-reve/elements/rich-text-editor.js';
import {createEditorCommandMatcher} from '@en-reve/elements/editor-command-matcher.js';
import type {TokenImportContext,TokenOptions,EditorExtension} from '@en-reve/elements/editor-extensions.js';
const limits:RichDocumentLimits={maxBytes:1000,maxDepth:8,maxNodes:100};
const document=decodeRichDocument(richDocumentFromRuns([{kind:'text',text:'Alpha'}],limits),limits);richDocumentText(document,limits);
declare const editor:EnRichTextEditor;
const range:RichRange={coordinate:'text',from:0,to:5,expectedText:'Alpha',revision:editor.revision};
const decorations:readonly RichRangeDecoration[]=[{id:'one',range}];const replacements:readonly RichRangeReplacement[]=[{range,runs:[{kind:'text',text:'New'}]}];
editor.captureRange();editor.validateRange(range);editor.decorateRanges(decorations);editor.clearRangeDecorations();editor.replaceRanges(replacements);
const options:TokenOptions={importToken:(token,context:TokenImportContext)=>{const source:string=context.sourceId;const scope:object=context.scope;void source;void scope;return {...token,data:{accepted:true}};}};void options;
const extension:EditorExtension={id:'commands',trigger:'/',label:'Commands',match:createEditorCommandMatcher(['insert table']),provide:()=>[]};void extension;
// @ts-expect-error Coordinates are explicitly text or structured.
const invalid:RichRange={...range,coordinate:'pixels'};void invalid;
// @ts-expect-error Snapshot document properties are readonly.
document.doc.type='paragraph';
