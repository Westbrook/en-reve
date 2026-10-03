/** Public specimen interactions. Source-derived fixtures require browser qualification. */
export const specimenStates = [
  {
    "id": "structured-values",
    "state": "svg-export",
    "actions": [
      {
        "kind": "select",
        "selector": "[data-specimen=\"structured-values\"] en-select select",
        "value": "svg"
      }
    ],
    "checks": [
      {
        "kind": "value",
        "selector": "[data-specimen=\"structured-values\"] en-select select",
        "value": "svg"
      }
    ]
  },
  {
    "id": "precision",
    "state": "increment",
    "actions": [
      {
        "kind": "press",
        "selector": "[data-specimen=\"precision\"] en-number-field input",
        "value": "ArrowUp"
      }
    ],
    "checks": [
      {
        "kind": "value",
        "selector": "[data-specimen=\"precision\"] en-number-field input",
        "value": "13"
      }
    ]
  },
  {
    "id": "combobox",
    "state": "filtered",
    "actions": [
      {
        "kind": "click",
        "selector": "[data-specimen=\"combobox\"] en-combobox input"
      },
      {
        "kind": "fill",
        "selector": "[data-specimen=\"combobox\"] en-combobox input",
        "value": "South"
      }
    ],
    "checks": [
      {
        "kind": "visible",
        "selector": "[data-specimen=\"combobox\"] [role=\"option\"]:has-text(\"Studio South\")"
      }
    ],
    "capture": "viewport"
  },
  {
    "id": "combobox",
    "state": "submitted",
    "actions": [
      {
        "kind": "click",
        "selector": "[data-specimen=\"combobox\"] en-combobox input"
      },
      {
        "kind": "fill",
        "selector": "[data-specimen=\"combobox\"] en-combobox input",
        "value": "South"
      },
      {
        "kind": "click",
        "selector": "[data-specimen=\"combobox\"] [role=\"option\"]:has-text(\"Studio South\")"
      },
      {
        "kind": "click",
        "selector": "[data-specimen=\"combobox\"] en-button:has-text(\"Use project\")"
      }
    ],
    "checks": [
      {
        "kind": "text",
        "selector": "[data-specimen=\"combobox\"] output",
        "value": "Submitted project: studio-south"
      }
    ]
  },
  {
    "id": "combobox",
    "state": "failed-load",
    "actions": [
      {
        "kind": "click",
        "selector": "[data-specimen=\"combobox\"] summary:has-text(\"Try suggestion states\")"
      },
      {
        "kind": "select",
        "selector": "[data-specimen=\"combobox\"] en-select select",
        "value": "failed"
      },
      {
        "kind": "click",
        "selector": "[data-specimen=\"combobox\"] en-combobox [part=\"trigger\"]"
      }
    ],
    "checks": [
      {
        "kind": "text",
        "selector": "[data-specimen=\"combobox\"] en-combobox [part=\"status\"]",
        "value": "Projects could not be loaded."
      }
    ],
    "capture": "viewport"
  },
  {
    "id": "calendar",
    "state": "selected-date",
    "actions": [
      {
        "kind": "click",
        "selector": "#specimen-calendar button[data-date=\"2026-09-22\"]"
      }
    ],
    "checks": [
      {
        "kind": "attribute",
        "selector": "#specimen-calendar td:has(button[data-date=\"2026-09-22\"])",
        "value": "true",
        "name": "aria-selected"
      }
    ]
  },
  {
    "id": "calendar",
    "state": "picker-open",
    "actions": [
      {
        "kind": "click",
        "selector": "#specimen-date-picker #picker-trigger button"
      }
    ],
    "checks": [
      {
        "kind": "visible",
        "selector": "#specimen-date-picker en-dialog dialog[open]"
      }
    ],
    "capture": "viewport"
  },
  {
    "id": "carousel",
    "state": "next-slide",
    "actions": [
      {
        "kind": "click",
        "selector": "#media-carousel en-button[part=\"next\"] button"
      }
    ],
    "checks": [
      {
        "kind": "text",
        "selector": "#media-carousel [part=\"position\"]",
        "value": "2 of 3"
      }
    ]
  },
  {
    "id": "card",
    "state": "keyboard-focus",
    "actions": [
      {
        "kind": "focus",
        "selector": "[data-specimen=\"card\"] en-button:has-text(\"Open study\") button"
      }
    ],
    "checks": [
      {
        "kind": "focused",
        "selector": "[data-specimen=\"card\"] en-button:has-text(\"Open study\") button"
      }
    ]
  },
  {
    "id": "tooltip-warmup",
    "state": "focused-help",
    "actions": [
      {
        "kind": "focus",
        "selector": "#canvas-guidance-trigger button"
      }
    ],
    "checks": [
      {
        "kind": "visible",
        "selector": "#canvas-guidance-tooltip [role=\"tooltip\"]"
      }
    ],
    "capture": "viewport"
  },
  {
    "id": "focus-motion",
    "state": "defaults-focus",
    "actions": [
      {
        "kind": "focus",
        "selector": "[data-focus-sample=\"defaults\"] en-text-field input"
      }
    ],
    "checks": [
      {
        "kind": "focused",
        "selector": "[data-focus-sample=\"defaults\"] en-text-field input"
      }
    ]
  },
  {
    "id": "focus-motion",
    "state": "recipe-focus",
    "actions": [
      {
        "kind": "focus",
        "selector": "[data-focus-sample=\"recipe\"] en-text-field input"
      }
    ],
    "checks": [
      {
        "kind": "focused",
        "selector": "[data-focus-sample=\"recipe\"] en-text-field input"
      }
    ]
  },
  {
    "id": "popup-motion",
    "state": "immediate-dialog",
    "actions": [
      {
        "kind": "click",
        "selector": "#motion-immediate-dialog"
      }
    ],
    "checks": [
      {
        "kind": "visible",
        "selector": "[data-popup-motion=\"immediate\"] en-dialog dialog[open]"
      }
    ],
    "capture": "viewport"
  },
  {
    "id": "popup-motion",
    "state": "motion-dialog",
    "actions": [
      {
        "kind": "click",
        "selector": "#motion-motion-dialog"
      }
    ],
    "checks": [
      {
        "kind": "visible",
        "selector": "[data-popup-motion=\"motion\"] en-dialog dialog[open]"
      }
    ],
    "capture": "viewport"
  },
  {
    "id": "authored-table",
    "state": "sort-descending",
    "actions": [
      {
        "kind": "click",
        "selector": "[data-specimen=\"authored-table\"] en-button:has-text(\"Sort Name\")"
      },
      {
        "kind": "click",
        "selector": "[data-specimen=\"authored-table\"] en-button:has-text(\"Sort Name\")"
      }
    ],
    "checks": [
      {
        "kind": "text",
        "selector": "[data-specimen=\"authored-table\"] output",
        "value": "Sorted by name, descending."
      }
    ]
  },
  {
    "id": "authored-table",
    "state": "selected-record",
    "actions": [
      {
        "kind": "click",
        "selector": "[data-specimen=\"authored-table\"] input[value=\"sparkle-mark\"]"
      }
    ],
    "checks": [
      {
        "kind": "checked",
        "selector": "[data-specimen=\"authored-table\"] input[value=\"sparkle-mark\"]"
      }
    ]
  },
  {
    "id": "content-recipes",
    "state": "loading",
    "actions": [
      {
        "kind": "click",
        "selector": "[data-specimen=\"content-recipes\"] en-checkbox"
      }
    ],
    "checks": [
      {
        "kind": "text",
        "selector": "[data-specimen=\"content-recipes\"] [data-content-loading-status]",
        "value": "Loading preview."
      }
    ]
  },
  {
    "id": "content-recipes",
    "state": "empty",
    "actions": [
      {
        "kind": "click",
        "selector": "[data-specimen=\"content-recipes\"] en-button:has-text(\"Show empty state\")"
      }
    ],
    "checks": [
      {
        "kind": "visible",
        "selector": "[data-specimen=\"content-recipes\"] [data-content-empty]"
      },
      {
        "kind": "hidden",
        "selector": "[data-specimen=\"content-recipes\"] [data-content-list]"
      }
    ]
  },
  {
    "id": "content-recipes",
    "state": "recovered-preview",
    "actions": [
      {
        "kind": "click",
        "selector": "[data-specimen=\"content-recipes\"] en-button:has-text(\"Retry local preview\")"
      }
    ],
    "checks": [
      {
        "kind": "text",
        "selector": "[data-specimen=\"content-recipes\"] [data-content-recovery-status]",
        "value": "Preview restored"
      }
    ]
  },
  {
    "id": "swatches",
    "state": "keyboard-focus",
    "actions": [
      {
        "kind": "focus",
        "selector": "[data-specimen=\"swatches\"] en-swatch button"
      }
    ],
    "checks": [
      {
        "kind": "focused",
        "selector": "[data-specimen=\"swatches\"] en-swatch button"
      }
    ]
  },
  {
    "id": "color-field",
    "state": "keyboard-focus",
    "actions": [
      {
        "kind": "focus",
        "selector": "[data-specimen=\"color-field\"] en-color-field input[type=\"color\"]"
      }
    ],
    "checks": [
      {
        "kind": "focused",
        "selector": "[data-specimen=\"color-field\"] en-color-field input[type=\"color\"]"
      }
    ]
  },
  {
    "id": "button-scale",
    "state": "keyboard-focus",
    "actions": [
      {
        "kind": "focus",
        "selector": "[data-specimen=\"button-scale\"] en-button[size=\"large\"] button"
      }
    ],
    "checks": [
      {
        "kind": "focused",
        "selector": "[data-specimen=\"button-scale\"] en-button[size=\"large\"] button"
      }
    ]
  },
  {
    "id": "messages",
    "state": "dismissed-warning",
    "actions": [
      {
        "kind": "click",
        "selector": "[data-specimen=\"messages\"] en-alert[variant=\"warning\"] [part=\"close\"]"
      }
    ],
    "checks": [
      {
        "kind": "hidden",
        "selector": "[data-specimen=\"messages\"] en-alert[variant=\"warning\"] [part=\"base\"]"
      }
    ]
  },
  {
    "id": "child-authored-choices",
    "state": "added-choice-submitted",
    "actions": [
      {
        "kind": "click",
        "selector": "[data-specimen=\"child-authored-choices\"] en-button:has-text(\"Add PDF and Square\")"
      },
      {
        "kind": "select",
        "selector": "#authored-format select",
        "value": "pdf"
      },
      {
        "kind": "click",
        "selector": "[data-specimen=\"child-authored-choices\"] en-button:has-text(\"Use these choices\")"
      }
    ],
    "checks": [
      {
        "kind": "text",
        "selector": "[data-specimen=\"child-authored-choices\"] [data-choice-receipt]",
        "value": "Submitted format: pdf; layout: portrait."
      }
    ]
  },
  {
    "id": "tree-data",
    "state": "scrolled-descendant",
    "actions": [
      {
        "kind": "click",
        "selector": "[data-specimen=\"tree-data\"] summary:has-text(\"Scroll to an item\")"
      },
      {
        "kind": "click",
        "selector": "[data-specimen=\"tree-data\"] en-button:has-text(\"Scroll to item\")"
      }
    ],
    "checks": [
      {
        "kind": "text",
        "selector": "[data-specimen=\"tree-data\"] [data-tree-data-status]",
        "value": "Scrolled to asset-10-025."
      },
      {
        "kind": "visible",
        "selector": "#specimen-tree-data [role=\"treeitem\"][aria-label=\"Asset 10 \u00b7 025\"]"
      }
    ]
  },
  {
    "id": "tree-data",
    "state": "collapsed",
    "actions": [
      {
        "kind": "click",
        "selector": "[data-specimen=\"tree-data\"] en-button:has-text(\"Collapse all collections\")"
      }
    ],
    "checks": [
      {
        "kind": "text",
        "selector": "[data-specimen=\"tree-data\"] [data-tree-data-status]",
        "value": "All collections collapsed."
      }
    ]
  },
  {
    "id": "tree-view",
    "state": "selected-accent",
    "actions": [
      {
        "kind": "click",
        "selector": "#specimen-tree en-tree-item[value=\"accent\"] [role=\"treeitem\"]"
      }
    ],
    "checks": [
      {
        "kind": "text",
        "selector": "[data-specimen=\"tree-view\"] [data-tree-result]",
        "value": "Selected accent."
      }
    ]
  },
  {
    "id": "composable-chat",
    "state": "tool-token",
    "actions": [
      {
        "kind": "click",
        "selector": "[data-specimen=\"composable-chat\"] en-token-editor [contenteditable=\"true\"]"
      },
      {
        "kind": "press",
        "selector": "[data-specimen=\"composable-chat\"] en-token-editor [contenteditable=\"true\"]",
        "value": "ControlOrMeta+a"
      },
      {
        "kind": "press",
        "selector": "[data-specimen=\"composable-chat\"] en-token-editor [contenteditable=\"true\"]",
        "value": "/"
      },
      {
        "kind": "press",
        "selector": "[data-specimen=\"composable-chat\"] en-token-editor [contenteditable=\"true\"]",
        "value": "s"
      },
      {
        "kind": "press",
        "selector": "[data-specimen=\"composable-chat\"] en-token-editor [contenteditable=\"true\"]",
        "value": "u"
      },
      {
        "kind": "press",
        "selector": "[data-specimen=\"composable-chat\"] en-token-editor [contenteditable=\"true\"]",
        "value": "m"
      },
      {
        "kind": "press",
        "selector": "[data-specimen=\"composable-chat\"] en-token-editor [contenteditable=\"true\"]",
        "value": "Enter"
      }
    ],
    "checks": [
      {
        "kind": "text",
        "selector": "[data-specimen=\"composable-chat\"] en-token-editor [contenteditable=\"true\"] [data-token]",
        "value": "/Summarize"
      }
    ]
  },
  {
    "id": "rich-text",
    "state": "reference-menu",
    "actions": [
      {
        "kind": "click",
        "selector": "#rich-brief [contenteditable=\"true\"]"
      },
      {
        "kind": "press",
        "selector": "#rich-brief [contenteditable=\"true\"]",
        "value": "ControlOrMeta+a"
      },
      {
        "kind": "press",
        "selector": "#rich-brief [contenteditable=\"true\"]",
        "value": "@"
      },
      {
        "kind": "press",
        "selector": "#rich-brief [contenteditable=\"true\"]",
        "value": "C"
      },
      {
        "kind": "press",
        "selector": "#rich-brief [contenteditable=\"true\"]",
        "value": "o"
      },
      {
        "kind": "press",
        "selector": "#rich-brief [contenteditable=\"true\"]",
        "value": "v"
      },
      {
        "kind": "press",
        "selector": "#rich-brief [contenteditable=\"true\"]",
        "value": "e"
      },
      {
        "kind": "press",
        "selector": "#rich-brief [contenteditable=\"true\"]",
        "value": "r"
      }
    ],
    "checks": [
      {
        "kind": "visible",
        "selector": "#rich-brief [role=\"option\"]:has-text(\"Cover study\")"
      }
    ],
    "capture": "viewport"
  },
  {
    "id": "rich-text",
    "state": "reference-token",
    "actions": [
      {
        "kind": "click",
        "selector": "#rich-brief [contenteditable=\"true\"]"
      },
      {
        "kind": "press",
        "selector": "#rich-brief [contenteditable=\"true\"]",
        "value": "ControlOrMeta+a"
      },
      {
        "kind": "press",
        "selector": "#rich-brief [contenteditable=\"true\"]",
        "value": "@"
      },
      {
        "kind": "press",
        "selector": "#rich-brief [contenteditable=\"true\"]",
        "value": "C"
      },
      {
        "kind": "press",
        "selector": "#rich-brief [contenteditable=\"true\"]",
        "value": "o"
      },
      {
        "kind": "press",
        "selector": "#rich-brief [contenteditable=\"true\"]",
        "value": "v"
      },
      {
        "kind": "press",
        "selector": "#rich-brief [contenteditable=\"true\"]",
        "value": "e"
      },
      {
        "kind": "press",
        "selector": "#rich-brief [contenteditable=\"true\"]",
        "value": "r"
      },
      {
        "kind": "press",
        "selector": "#rich-brief [contenteditable=\"true\"]",
        "value": "Enter"
      }
    ],
    "checks": [
      {
        "kind": "text",
        "selector": "#rich-brief [contenteditable=\"true\"] [data-token]",
        "value": "@Cover study"
      }
    ]
  },
  {
    "id": "virtual-collection",
    "state": "revealed-key",
    "actions": [
      {
        "kind": "click",
        "selector": "[data-specimen=\"virtual-collection\"] #scroll-demo-heading"
      },
      {
        "kind": "press",
        "selector": "[data-specimen=\"virtual-collection\"] #scroll-demo-heading",
        "value": "Tab"
      },
      {
        "kind": "fill",
        "selector": "[data-specimen=\"virtual-collection\"] en-text-field[label=\"Asset key\"] input",
        "value": "asset-09000"
      },
      {
        "kind": "press",
        "selector": "[data-specimen=\"virtual-collection\"] en-text-field[label=\"Asset key\"] input",
        "value": "Enter"
      },
      {
        "kind": "press",
        "selector": "[data-specimen=\"virtual-collection\"] en-text-field[label=\"Asset key\"] input",
        "value": "Tab"
      },
      {
        "kind": "press",
        "selector": "[data-specimen=\"virtual-collection\"] en-button:has-text(\"Show asset\") button",
        "value": "Enter"
      }
    ],
    "checks": [
      {
        "kind": "text",
        "selector": "[data-specimen=\"virtual-collection\"] [aria-label=\"Scroll result\"]",
        "value": "Returned true. Reveal requested; focus and selection are unchanged."
      },
      {
        "kind": "visible",
        "selector": "[data-specimen=\"virtual-collection\"] tr[data-en-virtual-key=\"asset-09000\"]"
      },
      {
        "kind": "value",
        "selector": "[data-specimen=\"virtual-collection\"] en-text-field[label=\"Asset key\"] input",
        "value": "asset-09000"
      },
      {
        "kind": "focused",
        "selector": "[data-specimen=\"virtual-collection\"] en-button:has-text(\"Show asset\") button"
      }
    ]
  }
];
