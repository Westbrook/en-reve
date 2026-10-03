import {defaultCases} from './plan.mjs';

const action=(kind,selector,value)=>({kind,selector,...(value===undefined?{}:{value})});
const check=(kind,selector,value,name)=>({kind,selector,...(value===undefined?{}:{value}),...(name===undefined?{}:{name})});
const click=selector=>action('click',selector);
const fill=(selector,value)=>action('fill',selector,value);
const visible=selector=>check('visible',selector);
const text=(selector,value)=>check('text',selector,value);
const attribute=(selector,name,value)=>check('attribute',selector,value,name);

/** Named states operate authored examples. No private method calls or state injection. */
export const authoredStates=[
 {id:'buttons',state:'keyboard-focus',actions:[action('focus','#api-save-changes button')],checks:[check('focused','#api-save-changes button')]},
 {id:'buttons',state:'hover',actions:[action('hover','#api-save-changes button')],checks:[visible('#api-save-changes button:hover')]},
 {id:'command-surfaces',state:'landscape',actions:[click('#specimen-toolbar en-button:has-text("Landscape")')],checks:[attribute('[data-command-preview]','data-layout','landscape')]},
 {id:'command-surfaces',state:'menu-open',capture:'viewport',actions:[click('#specimen-menu-trigger')],checks:[visible('#specimen-menu [role="menu"]')]},
 {id:'command-surfaces',state:'palette-empty',capture:'viewport',actions:[click('#specimen-command-trigger'),fill('#specimen-command-palette input','no-such-layout')],checks:[text('#specimen-command-palette','No matching layout commands.')]},
 {id:'menu-choices',state:'open',capture:'viewport',actions:[click('#menu-choices-trigger')],checks:[visible('#menu-choices [role="menu"][aria-label="Preview options"]')]},
 {id:'menu-choices',state:'nested-export',capture:'viewport',actions:[click('#menu-choices-trigger'),click('#menu-export-trigger')],checks:[visible('en-menu[label="Export format"] [role="menu"]')]},
 {id:'menu-choices',state:'landscape-selection',capture:'viewport',actions:[click('#menu-choices-trigger'),click('[data-menu-layout="landscape"]')],checks:[text('[data-menu-result]','Landscape preview; background included.')]},
 {id:'mixed-toolbar',state:'validation',actions:[fill('[data-study-title] input',''),click('[data-specimen="mixed-toolbar"] en-button:has-text("Apply preview settings")')],checks:[attribute('[data-study-title] input','aria-invalid','true')]},
 {id:'mixed-toolbar',state:'applied',actions:[fill('[data-study-title] input','Review study'),click('[data-specimen="mixed-toolbar"] en-button:has-text("Apply preview settings")')],checks:[text('[data-study-result]','Review study: PNG')]},
 {id:'text-fields',state:'editing',actions:[fill('[data-specimen="text-fields"] en-text-field[label="Project name"] input','Shared review draft')],checks:[check('value','[data-specimen="text-fields"] en-text-field[label="Project name"] input','Shared review draft')]},
 {id:'long-text-search',state:'multiline-and-query',actions:[fill('[data-specimen="long-text-search"] textarea','First direction\nSecond direction\nThird direction'),fill('[data-specimen="long-text-search"] en-search-input input','studio')],checks:[check('value','[data-specimen="long-text-search"] textarea','First direction\nSecond direction\nThird direction')]},
 {id:'checkboxes-switches',state:'checked-and-focused',actions:[click('#example-include-drafts input')],checks:[check('checked','#example-include-drafts input')]},
 {id:'radio-group',state:'highest-quality',actions:[click('[data-specimen="radio-group"] en-radio[value="best"] input')],checks:[check('checked','[data-specimen="radio-group"] en-radio[value="best"] input')]},
 {id:'tabs',state:'layout',actions:[click('#inspector-tab-layout')],checks:[attribute('#inspector-tab-layout','aria-selected','true'),visible('#inspector-panel-layout')]},
 {id:'accordion',state:'multiple-open',actions:[click('[data-specimen="accordion"] en-accordion-item[value="appearance"] button')],checks:[visible('[data-specimen="accordion"] en-accordion-item[value="appearance"] p'),visible('[data-specimen="accordion"] en-accordion-item[value="layout"] p')]},
 {id:'dialog-drawer',state:'dialog-open',capture:'viewport',actions:[click('#project-dialog-trigger')],checks:[visible('en-dialog[for="project-dialog-trigger"] dialog[open]')]},
 {id:'dialog-drawer',state:'drawer-open',capture:'viewport',actions:[click('#project-drawer-trigger')],checks:[visible('en-drawer[for="project-drawer-trigger"] dialog[open]')]},
 {id:'popover-tooltip',state:'popover-open',capture:'viewport',actions:[click('#view-options-trigger')],checks:[visible('en-popover[for="view-options-trigger"] [popover]:popover-open')]},
 {id:'popover-tooltip',state:'tooltip-focus',capture:'viewport',actions:[action('focus','#context-help-trigger button')],checks:[visible('en-tooltip[for="context-help-trigger"] [role="tooltip"]')]},
 {id:'workflow:sso',page:'sso',state:'validation',actions:[click('[data-sso-form="account"] en-button')],checks:[visible('[data-sso-validation]')]},
 {id:'workflow:sso',page:'sso',state:'provider-step',actions:[fill('#sso-workspace input','Studio'),fill('#sso-email input','review@example.com'),click('[data-sso-form="account"] en-button')],checks:[visible('[data-sso-form="provider"]')]},
 {id:'workflow:assets',page:'assets',state:'empty-search',actions:[fill('en-search-input[label="Find assets"] input','no-matching-asset')],checks:[text('[data-assets-count]','0 of')]},
];

export function catalogue(build) {
 const initial=defaultCases(build);
 const states=authoredStates.map(state=>{
  const base=initial.find(item=>item.id===state.id&&item.page===(state.page??'sheet'));
  if(!base)throw new Error('Authored visual state no longer belongs to the build: '+state.id);
  return {...base,...state};
 });
 return [...initial,...states];
}
