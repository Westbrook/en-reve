import {workflowStates} from './workflow-catalogue.mjs';
const focus = selector => ({actions:[{kind:'focus',selector}],checks:[{kind:'focused',selector}]});
const inherited = '[data-specimen="theme-scopes"] .scope-sample:not([data-en-theme])';
const nested = '[data-specimen="theme-scopes"] [data-en-theme="inverse"]';
const row = index => `[data-specimen="family-geometry"] .geometry-scope:nth-of-type(${index})`;
const relationship = (selector, referenceSelector, name, relation) => ({kind:'css-relationship',selector,referenceSelector,name,relation});
const scopeChecks = [
 relationship(nested,inherited,'background-color','different'),
 relationship(nested+' en-button button', inherited+' en-button button','background-color','different'),
];
const geometryChecks = [
 relationship(row(2)+' en-button button',row(1)+' en-button button','padding-inline-start','greater'),
 relationship(row(2)+' en-text-field input',row(1)+' en-text-field input','padding-inline-start','less'),
];
export const scopeStates = [
 ...workflowStates.filter(state=>state.page==='multi-step').map(({page,...state})=>({...state,id:'multi-step',actions:state.actions.flatMap(action=>action.kind==='fill'?[{kind:'click',selector:action.selector},action]:[action])})),
 {id:'theme-scopes',state:'inherited-focus',...focus(inherited+' en-button button'),checks:[{kind:'focused',selector:inherited+' en-button button'},...scopeChecks]},
 {id:'theme-scopes',state:'nested-focus',...focus(nested+' en-button button'),checks:[{kind:'focused',selector:nested+' en-button button'},...scopeChecks]},
 {id:'local-override',state:'square-focus',...focus('[data-specimen="local-override"] en-button button'),checks:[
  {kind:'focused',selector:'[data-specimen="local-override"] en-button button'},
  {kind:'css',selector:'[data-specimen="local-override"] en-button button',name:'border-top-left-radius',value:'0px'},
  relationship('[data-specimen="local-override"] en-button button','[data-specimen="theme-scopes"] .scope-sample:not([data-en-theme]) en-button button','border-top-left-radius','different'),
 ]},
 {id:'family-geometry',state:'shared-focus',...focus(row(1)+' en-text-field input'),checks:[{kind:'focused',selector:row(1)+' en-text-field input'},...geometryChecks]},
 {id:'family-geometry',state:'scoped-focus',...focus(row(2)+' en-text-field input'),checks:[{kind:'focused',selector:row(2)+' en-text-field input'},...geometryChecks]},
 {id:'native-navigation',state:'link-focus',...focus('[data-specimen="native-navigation"] a[href="#fields"]')},
 {id:'breadcrumbs',state:'link-focus',...focus('[data-specimen="breadcrumbs"] a[href="#sheet"]')},
];
