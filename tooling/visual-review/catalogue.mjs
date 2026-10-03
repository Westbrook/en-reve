import {defaultCases} from './plan.mjs';
import {workflowStates} from './workflow-catalogue.mjs';
import {specimenStates} from './specimen-catalogue.mjs';
import {scopeStates} from './scope-catalogue.mjs';

const action=(kind,selector,value)=>({kind,selector,...(value===undefined?{}:{value})});
const check=(kind,selector,value,name)=>({kind,selector,...(value===undefined?{}:{value}),...(name===undefined?{}:{name})});
const click=selector=>action('click',selector);
const fill=(selector,value)=>action('fill',selector,value);
const visible=selector=>check('visible',selector);
const text=(selector,value)=>check('text',selector,value);
const attribute=(selector,name,value)=>check('attribute',selector,value,name);

/** Named states operate authored examples. No private method calls or state injection. */
export const authoredStates=[
 ...workflowStates,
 ...specimenStates,
 ...scopeStates,
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
 ...[
  {
    "id": "color-wheel",
    "state": "keyboard-hue",
    "actions": [
      {
        "kind": "press",
        "selector": "[data-specimen=\"color-wheel\"] en-color-wheel [role=\"slider\"]",
        "value": "Home"
      },
      {
        "kind": "press",
        "selector": "[data-specimen=\"color-wheel\"] en-color-wheel [role=\"slider\"]",
        "value": "PageUp"
      },
      {
        "kind": "press",
        "selector": "[data-specimen=\"color-wheel\"] en-color-wheel [role=\"slider\"]",
        "value": "ArrowRight"
      }
    ],
    "checks": [
      {
        "kind": "attribute",
        "selector": "[data-specimen=\"color-wheel\"] en-color-wheel [role=\"slider\"]",
        "value": "11",
        "name": "aria-valuenow"
      }
    ]
  },
  {
    "id": "color-wheel",
    "state": "exact-hue",
    "actions": [
      {
        "kind": "fill",
        "selector": "[data-specimen=\"color-wheel\"] en-color-wheel en-text-field input",
        "value": "120"
      },
      {
        "kind": "press",
        "selector": "[data-specimen=\"color-wheel\"] en-color-wheel en-text-field input",
        "value": "Enter"
      }
    ],
    "checks": [
      {
        "kind": "attribute",
        "selector": "[data-specimen=\"color-wheel\"] en-color-wheel [role=\"slider\"]",
        "value": "120",
        "name": "aria-valuenow"
      }
    ]
  },
  {
    "id": "color-wheel",
    "state": "invalid-hue",
    "actions": [
      {
        "kind": "fill",
        "selector": "[data-specimen=\"color-wheel\"] en-color-wheel en-text-field input",
        "value": "361"
      },
      {
        "kind": "press",
        "selector": "[data-specimen=\"color-wheel\"] en-color-wheel en-text-field input",
        "value": "Enter"
      }
    ],
    "checks": [
      {
        "kind": "value",
        "selector": "[data-specimen=\"color-wheel\"] en-color-wheel en-text-field input",
        "value": "361"
      },
      {
        "kind": "attribute",
        "selector": "[data-specimen=\"color-wheel\"] en-color-wheel en-text-field input",
        "value": "true",
        "name": "aria-invalid"
      }
    ]
  },
  {
    "id": "color-wheel",
    "state": "invalid-recovery",
    "actions": [
      {
        "kind": "fill",
        "selector": "[data-specimen=\"color-wheel\"] en-color-wheel en-text-field input",
        "value": "120"
      },
      {
        "kind": "press",
        "selector": "[data-specimen=\"color-wheel\"] en-color-wheel en-text-field input",
        "value": "Enter"
      },
      {
        "kind": "fill",
        "selector": "[data-specimen=\"color-wheel\"] en-color-wheel en-text-field input",
        "value": "361"
      },
      {
        "kind": "press",
        "selector": "[data-specimen=\"color-wheel\"] en-color-wheel en-text-field input",
        "value": "Enter"
      },
      {
        "kind": "press",
        "selector": "[data-specimen=\"color-wheel\"] en-color-wheel en-text-field input",
        "value": "Escape"
      }
    ],
    "checks": [
      {
        "kind": "value",
        "selector": "[data-specimen=\"color-wheel\"] en-color-wheel en-text-field input",
        "value": "120"
      },
      {
        "kind": "attribute",
        "selector": "[data-specimen=\"color-wheel\"] en-color-wheel [role=\"slider\"]",
        "value": "120",
        "name": "aria-valuenow"
      }
    ]
  },
  {
    "id": "color-plane",
    "state": "hue-keyboard",
    "actions": [
      {
        "kind": "press",
        "selector": "[data-specimen=\"color-plane\"] en-color-plane en-color-slider[part~=\"hue\"] input[type=\"range\"]",
        "value": "Home"
      }
    ],
    "checks": [
      {
        "kind": "value",
        "selector": "[data-specimen=\"color-plane\"] en-color-plane en-color-slider[part~=\"hue\"] input[type=\"range\"]",
        "value": "0"
      }
    ]
  },
  {
    "id": "color-plane",
    "state": "transparent",
    "actions": [
      {
        "kind": "fill",
        "selector": "[data-specimen=\"color-plane\"] en-color-plane en-color-slider[part~=\"alpha\"] en-text-field input",
        "value": "34"
      },
      {
        "kind": "press",
        "selector": "[data-specimen=\"color-plane\"] en-color-plane en-color-slider[part~=\"alpha\"] en-text-field input",
        "value": "Enter"
      }
    ],
    "checks": [
      {
        "kind": "value",
        "selector": "[data-specimen=\"color-plane\"] en-color-plane en-color-slider[part~=\"alpha\"] input[type=\"range\"]",
        "value": "34"
      }
    ]
  },
  {
    "id": "color-plane",
    "state": "exact-value",
    "actions": [
      {
        "kind": "fill",
        "selector": "[data-specimen=\"color-plane\"] en-color-plane en-color-slider[part~=\"brightness\"] en-text-field input",
        "value": "80"
      },
      {
        "kind": "press",
        "selector": "[data-specimen=\"color-plane\"] en-color-plane en-color-slider[part~=\"brightness\"] en-text-field input",
        "value": "Enter"
      }
    ],
    "checks": [
      {
        "kind": "value",
        "selector": "[data-specimen=\"color-plane\"] en-color-plane en-color-slider[part~=\"brightness\"] input[type=\"range\"]",
        "value": "80"
      }
    ]
  },
  {
    "id": "color-slider",
    "state": "transparent",
    "actions": [
      {
        "kind": "fill",
        "selector": "[data-specimen=\"color-slider\"] en-color-slider en-text-field input",
        "value": "25"
      },
      {
        "kind": "press",
        "selector": "[data-specimen=\"color-slider\"] en-color-slider en-text-field input",
        "value": "Enter"
      }
    ],
    "checks": [
      {
        "kind": "value",
        "selector": "[data-specimen=\"color-slider\"] en-color-slider input[type=\"range\"]",
        "value": "25"
      }
    ]
  },
  {
    "id": "color-slider",
    "state": "invalid-draft",
    "actions": [
      {
        "kind": "fill",
        "selector": "[data-specimen=\"color-slider\"] en-color-slider en-text-field input",
        "value": "101"
      },
      {
        "kind": "press",
        "selector": "[data-specimen=\"color-slider\"] en-color-slider en-text-field input",
        "value": "Enter"
      }
    ],
    "checks": [
      {
        "kind": "value",
        "selector": "[data-specimen=\"color-slider\"] en-color-slider en-text-field input",
        "value": "101"
      },
      {
        "kind": "attribute",
        "selector": "[data-specimen=\"color-slider\"] en-color-slider en-text-field input",
        "value": "true",
        "name": "aria-invalid"
      }
    ]
  },
  {
    "id": "color-picker",
    "state": "rgb-format",
    "actions": [
      {
        "kind": "select",
        "selector": "#basic-color-picker en-select select",
        "value": "rgb"
      }
    ],
    "checks": [
      {
        "kind": "value",
        "selector": "#basic-color-picker en-select select",
        "value": "rgb"
      },
      {
        "kind": "visible",
        "selector": "#basic-color-picker en-color-slider[label=\"Red\"]"
      }
    ]
  },
  {
    "id": "color-picker",
    "state": "hsl-format",
    "actions": [
      {
        "kind": "select",
        "selector": "#basic-color-picker en-select select",
        "value": "hsl"
      }
    ],
    "checks": [
      {
        "kind": "value",
        "selector": "#basic-color-picker en-select select",
        "value": "hsl"
      },
      {
        "kind": "visible",
        "selector": "#basic-color-picker en-color-slider[label=\"Hue\"]"
      }
    ]
  },
  {
    "id": "color-picker",
    "state": "alpha-enabled",
    "actions": [
      {
        "kind": "click",
        "selector": "#basic-color-picker en-switch input"
      }
    ],
    "checks": [
      {
        "kind": "checked",
        "selector": "#basic-color-picker en-switch input"
      },
      {
        "kind": "visible",
        "selector": "#basic-color-picker en-color-slider[label=\"Alpha\"]"
      }
    ]
  },
  {
    "id": "color-picker",
    "state": "invalid-hex",
    "actions": [
      {
        "kind": "fill",
        "selector": "#basic-color-picker #hex input",
        "value": "not-a-color"
      },
      {
        "kind": "press",
        "selector": "#basic-color-picker #hex input",
        "value": "Enter"
      }
    ],
    "checks": [
      {
        "kind": "value",
        "selector": "#basic-color-picker #hex input",
        "value": "not-a-color"
      },
      {
        "kind": "attribute",
        "selector": "#basic-color-picker #hex input",
        "value": "true",
        "name": "aria-invalid"
      }
    ]
  },
  {
    "id": "opacity",
    "state": "exact-value",
    "actions": [
      {
        "kind": "fill",
        "selector": "[data-specimen=\"opacity\"] en-slider input[type=\"number\"]",
        "value": "25"
      },
      {
        "kind": "press",
        "selector": "[data-specimen=\"opacity\"] en-slider input[type=\"number\"]",
        "value": "Enter"
      }
    ],
    "checks": [
      {
        "kind": "value",
        "selector": "[data-specimen=\"opacity\"] en-slider input[type=\"range\"]",
        "value": "25"
      }
    ]
  },
  {
    "id": "opacity",
    "state": "invalid-draft",
    "actions": [
      {
        "kind": "fill",
        "selector": "[data-specimen=\"opacity\"] en-slider input[type=\"number\"]",
        "value": "101"
      },
      {
        "kind": "press",
        "selector": "[data-specimen=\"opacity\"] en-slider input[type=\"number\"]",
        "value": "Enter"
      }
    ],
    "checks": [
      {
        "kind": "value",
        "selector": "[data-specimen=\"opacity\"] en-slider input[type=\"number\"]",
        "value": "101"
      },
      {
        "kind": "visible",
        "selector": "[data-specimen=\"opacity\"] en-slider [part=\"error\"]"
      }
    ]
  },
  {
    "id": "vertical-slider",
    "state": "keyboard-maximum",
    "actions": [
      {
        "kind": "press",
        "selector": "[data-specimen=\"vertical-slider\"] en-slider input[type=\"range\"]",
        "value": "End"
      }
    ],
    "checks": [
      {
        "kind": "value",
        "selector": "[data-specimen=\"vertical-slider\"] en-slider input[type=\"range\"]",
        "value": "96"
      }
    ]
  },
  {
    "id": "rating",
    "state": "cleared",
    "actions": [
      {
        "kind": "click",
        "selector": "[data-specimen=\"rating\"] label:has(input[value=\"0\"])"
      }
    ],
    "checks": [
      {
        "kind": "checked",
        "selector": "[data-specimen=\"rating\"] input[value=\"0\"]"
      }
    ]
  },
  {
    "id": "navigation-sidebar",
    "state": "current-branch",
    "actions": [
      {"kind":"click","selector":"#workspace-navigation [part=\"disclosure\"] > summary","whenViewport":{"maxWidth":768}},
      {
        "kind": "click",
        "selector": "[data-sidebar-demo] summary:has-text(\"Dynamic content and review scenarios\")"
      },
      {
        "kind": "click",
        "selector": "[data-sidebar-demo] en-button:has-text(\"Mark archive current\")"
      }
    ],
    "checks": [
      {
        "kind": "attribute",
        "selector": "#archive-link",
        "value": "location",
        "name": "aria-current"
      },
      {
        "kind": "visible",
        "selector": "#library-group details[open]"
      }
    ]
  },
  {
    "id": "navigation-sidebar",
    "state": "added-link",
    "actions": [
      {"kind":"click","selector":"#workspace-navigation [part=\"disclosure\"] > summary","whenViewport":{"maxWidth":768}},
      {
        "kind": "click",
        "selector": "[data-sidebar-demo] summary:has-text(\"Dynamic content and review scenarios\")"
      },
      {
        "kind": "click",
        "selector": "[data-sidebar-demo] en-button:has-text(\"Add or remove a link\")"
      }
    ],
    "checks": [
      {
        "kind": "count",
        "selector": "[data-sidebar-demo] [data-added-link]",
        "value": 1
      }
    ]
  },
  {
    "id": "navigation-sidebar",
    "state": "drawer-open",
    "actions": [
      {
        "kind": "click",
        "selector": "en-sidebar-drawer-demo en-button:has-text(\"Preview mobile Drawer\")"
      },
      {
        "kind": "click",
        "selector": "en-sidebar-drawer-demo #drawer-navigation-trigger"
      }
    ],
    "checks": [
      {
        "kind": "visible",
        "selector": "en-sidebar-drawer-demo en-drawer dialog[open]"
      }
    ],
    "capture": "viewport"
  },
  {
    "id": "pagination",
    "state": "next-page",
    "actions": [
      {
        "kind": "click",
        "selector": "#api-pagination button[part~=\"next\"]"
      }
    ],
    "checks": [
      {
        "kind": "text",
        "selector": "[aria-label=\"Project page result\"]",
        "value": "Page 2 of 12."
      }
    ]
  },
  {
    "id": "pagination",
    "state": "chooser-open",
    "actions": [
      {
        "kind": "click",
        "selector": "#api-pagination button[part~=\"direct-summary\"]:visible"
      }
    ],
    "checks": [
      {
        "kind": "visible",
        "selector": "#api-pagination [role=\"dialog\"]:popover-open"
      }
    ],
    "capture": "viewport"
  },
  {
    "id": "pagination",
    "state": "last-page",
    "actions": [
      {
        "kind": "click",
        "selector": "#api-pagination button[part~=\"direct-summary\"]:visible"
      },
      {
        "kind": "fill",
        "selector": "#api-pagination input[part~=\"page-input\"]",
        "value": "12"
      },
      {
        "kind": "click",
        "selector": "#api-pagination button[part~=\"go\"]"
      }
    ],
    "checks": [
      {
        "kind": "text",
        "selector": "[aria-label=\"Project page result\"]",
        "value": "Page 12 of 12."
      },
      {
        "kind": "hidden",
        "selector": "#api-pagination [role=\"dialog\"]"
      }
    ]
  },
  {
    "id": "pagination",
    "state": "held-page",
    "actions": [
      {
        "kind": "click",
        "selector": "[data-specimen=\"pagination\"] en-checkbox input"
      },
      {
        "kind": "click",
        "selector": "#api-pagination button[part~=\"next\"]"
      }
    ],
    "checks": [
      {
        "kind": "checked",
        "selector": "[data-specimen=\"pagination\"] en-checkbox input"
      },
      {
        "kind": "text",
        "selector": "[aria-label=\"Project page result\"]",
        "value": "canceled"
      }
    ]
  },
  {
    "id": "data-table",
    "state": "selected-row",
    "actions": [
      {
        "kind": "click",
        "selector": "#records-table tbody tr:has-text(\"Study 0001\") en-checkbox input"
      }
    ],
    "checks": [
      {
        "kind": "checked",
        "selector": "#records-table tbody tr:has-text(\"Study 0001\") en-checkbox input"
      }
    ]
  },
  {
    "id": "data-table",
    "state": "distant-row",
    "actions": [
      {
        "kind": "select",
        "selector": "[data-table-demo] en-select[label=\"Delivery\"] select",
        "value": "windowed"
      },
      {
        "kind": "click",
        "selector": "[data-table-demo] en-button:has-text(\"Show Study 0901\")"
      }
    ],
    "checks": [
      {
        "kind": "visible",
        "selector": "#records-table tbody tr:has-text(\"Study 0901\")"
      },
      {
        "kind": "text",
        "selector": "[data-table-demo] p[role=\"status\"]",
        "value": "Reveal requested"
      }
    ]
  },
  {
    "id": "split-view",
    "state": "collapsed",
    "actions": [
      {
        "kind": "press",
        "selector": "#workspace-split en-splitter[aria-label=\"Resize navigation\"]",
        "value": "Enter"
      }
    ],
    "checks": [
      {
        "kind": "visible",
        "selector": "#workspace-split en-button:has-text(\"Restore Navigation\")"
      },
      {
        "kind": "text",
        "selector": "[data-split-workspace] p[role=\"status\"]",
        "value": "Pane collapsed"
      }
    ]
  },
  {
    "id": "split-view",
    "state": "restored-draft",
    "actions": [
      {
        "kind": "fill",
        "selector": "#inspector-split en-text-field[label=\"Project title\"] input",
        "value": "Retained review draft"
      },
      {
        "kind": "press",
        "selector": "#workspace-split en-splitter[aria-label=\"Resize navigation\"]",
        "value": "Enter"
      },
      {
        "kind": "click",
        "selector": "#workspace-split en-button:has-text(\"Restore Navigation\")"
      }
    ],
    "checks": [
      {
        "kind": "value",
        "selector": "#inspector-split en-text-field[label=\"Project title\"] input",
        "value": "Retained review draft"
      },
      {
        "kind": "visible",
        "selector": "#workspace-split en-splitter[aria-label=\"Resize navigation\"]"
      }
    ]
  },
  {
    "id": "split-view-vertical",
    "state": "maximum",
    "actions": [
      {
        "kind": "press",
        "selector": "[data-specimen=\"split-view-vertical\"] en-splitter",
        "value": "End"
      }
    ],
    "checks": [
      {
        "kind": "attribute",
        "selector": "[data-specimen=\"split-view-vertical\"] en-splitter",
        "value": "80",
        "name": "aria-valuenow"
      }
    ]
  },
  {
    "id": "toast",
    "state": "failed-upload",
    "actions": [
      {
        "kind": "click",
        "selector": "[data-toast-demo] en-button:has-text(\"Simulate failed upload\")"
      }
    ],
    "checks": [
      {
        "kind": "visible",
        "selector": "[data-toast-demo] en-toast-region[label=\"Demo notifications\"] en-button:has-text(\"Retry upload\")"
      },
      {
        "kind": "text",
        "selector": "[data-toast-demo] en-toast-region[label=\"Demo notifications\"]",
        "value": "Upload failed. Your file is still available."
      }
    ]
  },
  {
    "id": "toast",
    "state": "retried-upload",
    "actions": [
      {
        "kind": "click",
        "selector": "[data-toast-demo] en-button:has-text(\"Simulate failed upload\")"
      },
      {
        "kind": "click",
        "selector": "[data-toast-demo] en-toast-region[label=\"Demo notifications\"] en-button:has-text(\"Retry upload\")"
      }
    ],
    "checks": [
      {
        "kind": "text",
        "selector": "[data-toast-demo] [data-toast-log]",
        "value": "Upload retry succeeded locally."
      },
      {
        "kind": "text",
        "selector": "[data-toast-demo] en-toast-region[label=\"Demo notifications\"]",
        "value": "Upload completed."
      }
    ]
  },
  {
    "id": "toast",
    "state": "waiting-history",
    "actions": [
      {
        "kind": "click",
        "selector": "[data-toast-demo] en-button:has-text(\"Queue three updates\")"
      },
      {
        "kind": "click",
        "selector": "[data-toast-demo] en-toast-region[label=\"Demo notifications\"] summary"
      }
    ],
    "checks": [
      {
        "kind": "visible",
        "selector": "[data-toast-demo] en-toast-region[label=\"Demo notifications\"] [part=\"stack-summary\"]"
      },
      {
        "kind": "text",
        "selector": "[data-toast-demo] en-toast-region[label=\"Demo notifications\"] [part=\"history\"]",
        "value": "Waiting (1)"
      }
    ]
  },
  {
    "id": "toast",
    "state": "interruption",
    "actions": [
      {
        "kind": "click",
        "selector": "[data-toast-demo] en-button:has-text(\"Queue three updates\")"
      },
      {
        "kind": "click",
        "selector": "[data-toast-demo] en-button:has-text(\"Timely interruption\")"
      }
    ],
    "checks": [
      {
        "kind": "text",
        "selector": "[data-toast-demo] en-toast-region[label=\"Demo notifications\"] en-toast >> nth=0",
        "value": "Your review session is about to end."
      }
    ]
  },
  {
    "id": "toast",
    "state": "closed-history",
    "actions": [
      {
        "kind": "click",
        "selector": "[data-toast-demo] en-button:has-text(\"Save snapshot\")"
      },
      {
        "kind": "click",
        "selector": "[data-toast-demo] en-button:has-text(\"Dismiss all\")"
      },
      {
        "kind": "click",
        "selector": "[data-toast-demo] en-toast-region[label=\"Demo notifications\"] summary"
      }
    ],
    "checks": [
      {
        "kind": "text",
        "selector": "[data-toast-demo] en-toast-region[label=\"Demo notifications\"] [part=\"history\"]",
        "value": "Settings snapshot 1 saved."
      },
      {
        "kind": "visible",
        "selector": "[data-toast-demo] en-toast-region[label=\"Demo notifications\"] [part=\"history\"]"
      }
    ]
  },
  {
    "id": "presence-activity",
    "state": "away",
    "actions": [
      {
        "kind": "click",
        "selector": "[data-presence-activity-demo] en-button:has-text(\"Toggle Mira\u2019s availability\")"
      }
    ],
    "checks": [
      {
        "kind": "attribute",
        "selector": "#presence-example",
        "value": "away",
        "name": "status"
      }
    ]
  },
  {
    "id": "presence-activity",
    "state": "empty",
    "actions": [
      {
        "kind": "click",
        "selector": "[data-presence-activity-demo] en-button:has-text(\"Toggle empty state\")"
      }
    ],
    "checks": [
      {
        "kind": "visible",
        "selector": "#activity-feed-example [slot=\"empty\"]"
      }
    ]
  },
  {
    "id": "presence-activity",
    "state": "loading-older",
    "actions": [
      {
        "kind": "click",
        "selector": "#activity-feed-example [part=\"load-more\"]"
      }
    ],
    "checks": [
      {
        "kind": "visible",
        "selector": "[data-presence-activity-demo] [data-activity-placeholder]"
      },
      {
        "kind": "text",
        "selector": "[data-presence-activity-demo] .older-status",
        "value": "Loading one older update."
      }
    ]
  },
  {
    "id": "presence-activity",
    "state": "loaded-older",
    "actions": [
      {
        "kind": "click",
        "selector": "#activity-feed-example [part=\"load-more\"]"
      },
      {
        "kind": "click",
        "selector": "[data-presence-activity-demo] en-button:has-text(\"Complete load\")"
      }
    ],
    "checks": [
      {
        "kind": "text",
        "selector": "[data-presence-activity-demo] .older-status",
        "value": "Loaded one older update."
      },
      {
        "kind": "visible",
        "selector": "[data-presence-activity-demo] en-activity-feed[label=\"September 14 project activity\"] en-activity-item"
      }
    ]
  },
  {
    "id": "presence-activity",
    "state": "failed-older",
    "actions": [
      {
        "kind": "click",
        "selector": "#activity-feed-example [part=\"load-more\"]"
      },
      {
        "kind": "click",
        "selector": "[data-presence-activity-demo] en-button:has-text(\"Fail load\")"
      }
    ],
    "checks": [
      {
        "kind": "text",
        "selector": "[data-presence-activity-demo] .older-status",
        "value": "Older activity could not be loaded."
      },
      {
        "kind": "text",
        "selector": "#activity-feed-example [part=\"load-more\"]",
        "value": "Retry older activity"
      }
    ]
  },
  {
    "id": "chat-patterns",
    "state": "sending",
    "actions": [
      {
        "kind": "fill",
        "selector": "#chat-composer-example textarea",
        "value": "Please review this draft."
      },
      {
        "kind": "click",
        "selector": "#chat-composer-example [part=\"send\"] en-button"
      }
    ],
    "checks": [
      {
        "kind": "text",
        "selector": "[data-chat-patterns-demo] en-chat-message[outgoing]",
        "value": "Sending\u2026"
      }
    ]
  },
  {
    "id": "chat-patterns",
    "state": "failed-send",
    "actions": [
      {
        "kind": "fill",
        "selector": "#chat-composer-example textarea",
        "value": "Please review this draft."
      },
      {
        "kind": "click",
        "selector": "#chat-composer-example [part=\"send\"] en-button"
      },
      {
        "kind": "click",
        "selector": "[data-chat-patterns-demo] en-button:has-text(\"Fail send\")"
      }
    ],
    "checks": [
      {
        "kind": "visible",
        "selector": "[data-chat-patterns-demo] en-chat-message[outgoing] en-button:has-text(\"Retry message\")"
      },
      {
        "kind": "text",
        "selector": "[data-chat-patterns-demo] en-chat-message[outgoing]",
        "value": "Not sent"
      }
    ]
  },
  {
    "id": "chat-patterns",
    "state": "retry-with-new-draft",
    "actions": [
      {
        "kind": "fill",
        "selector": "#chat-composer-example textarea",
        "value": "Please review this draft."
      },
      {
        "kind": "click",
        "selector": "#chat-composer-example [part=\"send\"] en-button"
      },
      {
        "kind": "click",
        "selector": "[data-chat-patterns-demo] en-button:has-text(\"Fail send\")"
      },
      {
        "kind": "fill",
        "selector": "#chat-composer-example textarea",
        "value": "A newer unsent draft."
      },
      {
        "kind": "click",
        "selector": "[data-chat-patterns-demo] en-chat-message[outgoing] en-button:has-text(\"Retry message\")"
      },
      {
        "kind": "click",
        "selector": "[data-chat-patterns-demo] en-button:has-text(\"Complete send\")"
      }
    ],
    "checks": [
      {
        "kind": "value",
        "selector": "#chat-composer-example textarea",
        "value": "A newer unsent draft."
      },
      {
        "kind": "text",
        "selector": "[data-chat-patterns-demo] en-chat-message[outgoing]",
        "value": "Sent locally"
      }
    ]
  }
],
 ...[
  {
    "id": "file-upload",
    "state": "selected",
    "actions": [
      {
        "kind": "files",
        "selector": "#file-upload-choice input[type=\"file\"]",
        "files": [
          {
            "name": "study.pdf",
            "mimeType": "application/pdf",
            "base64": "JVBERi0xLjcK"
          }
        ]
      }
    ],
    "checks": [
      {
        "kind": "text",
        "selector": "[data-upload-status]",
        "value": "1 file(s) ready."
      },
      {
        "kind": "text",
        "selector": "#file-upload-choice [part=\"file-name\"]",
        "value": "study.pdf"
      }
    ]
  },
  {
    "id": "file-upload",
    "state": "transfer-failed",
    "actions": [
      {
        "kind": "files",
        "selector": "#file-upload-choice input[type=\"file\"]",
        "files": [
          {
            "name": "study.pdf",
            "mimeType": "application/pdf",
            "base64": "JVBERi0xLjcK"
          }
        ]
      },
      {
        "kind": "click",
        "selector": "#file-upload-surface en-button:has-text(\"Start simulated transfer\")"
      },
      {
        "kind": "click",
        "selector": "#file-upload-surface en-button:has-text(\"Fail transfer\")"
      }
    ],
    "checks": [
      {
        "kind": "text",
        "selector": "[data-upload-status]",
        "value": "Simulated connection failure."
      },
      {
        "kind": "visible",
        "selector": "#file-upload-surface en-button:has-text(\"Retry transfer\")"
      }
    ]
  },
  {
    "id": "file-upload",
    "state": "transfer-complete",
    "actions": [
      {
        "kind": "files",
        "selector": "#file-upload-choice input[type=\"file\"]",
        "files": [
          {
            "name": "study.pdf",
            "mimeType": "application/pdf",
            "base64": "JVBERi0xLjcK"
          }
        ]
      },
      {
        "kind": "click",
        "selector": "#file-upload-surface en-button:has-text(\"Start simulated transfer\")"
      },
      {
        "kind": "click",
        "selector": "#file-upload-surface en-button:has-text(\"Complete transfer\")"
      }
    ],
    "checks": [
      {
        "kind": "text",
        "selector": "[data-upload-receipt]",
        "value": "study.pdf"
      }
    ]
  },
  {
    "id": "file-upload",
    "state": "transfer-cancelled",
    "actions": [
      {
        "kind": "files",
        "selector": "#file-upload-choice input[type=\"file\"]",
        "files": [
          {
            "name": "study.pdf",
            "mimeType": "application/pdf",
            "base64": "JVBERi0xLjcK"
          }
        ]
      },
      {
        "kind": "click",
        "selector": "#file-upload-surface en-button:has-text(\"Start simulated transfer\")"
      },
      {
        "kind": "click",
        "selector": "#file-upload-surface en-button:has-text(\"Cancel transfer\")"
      }
    ],
    "checks": [
      {
        "kind": "text",
        "selector": "[data-upload-status]",
        "value": "Simulated transfer canceled."
      }
    ]
  },
  {
    "id": "color-plane",
    "state": "pointer-preview",
    "actions": [
      {
        "kind": "drag",
        "selector": "[data-specimen=\"color-plane\"] en-color-plane [part=\"plane\"]",
        "from": {
          "x": 0.2,
          "y": 0.2
        },
        "to": {
          "x": 0.5,
          "y": 0.5
        },
        "end": "hold"
      }
    ],
    "checks": [
      {
        "kind": "value",
        "selector": "[data-specimen=\"color-plane\"] en-color-slider[part~=\"saturation\"] input[type=\"range\"]",
        "value": "50"
      }
    ]
  },
  {
    "id": "color-plane",
    "state": "pointer-commit",
    "actions": [
      {
        "kind": "drag",
        "selector": "[data-specimen=\"color-plane\"] en-color-plane [part=\"plane\"]",
        "from": {
          "x": 0.2,
          "y": 0.2
        },
        "to": {
          "x": 0.5,
          "y": 0.5
        },
        "end": "release"
      }
    ],
    "checks": [
      {
        "kind": "value",
        "selector": "[data-specimen=\"color-plane\"] en-color-slider[part~=\"saturation\"] input[type=\"range\"]",
        "value": "50"
      }
    ]
  },
  {
    "id": "color-plane",
    "state": "pointer-cancel",
    "actions": [
      {"kind":"focus","selector":"[data-specimen=\"color-plane\"] en-color-slider[part~=\"saturation\"] input[type=\"range\"]"},
      {
        "kind": "drag",
        "selector": "[data-specimen=\"color-plane\"] en-color-plane [part=\"plane\"]",
        "from": {
          "x": 0.2,
          "y": 0.2
        },
        "to": {
          "x": 0.5,
          "y": 0.5
        },
        "end": "escape"
      }
    ],
    "checks": [
      {
        "kind": "value",
        "selector": "[data-specimen=\"color-plane\"] en-color-slider[part~=\"saturation\"] input[type=\"range\"]",
        "value": "58.3"
      }
    ]
  }
],
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
