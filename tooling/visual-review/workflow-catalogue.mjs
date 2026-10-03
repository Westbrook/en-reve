/** Public workflow interactions. Captures require observable outcomes, never private state injection. */
export const workflowStates = [
  {
    "id": "workflow:settings",
    "page": "settings",
    "state": "edited-output",
    "actions": [
      {
        "kind": "fill",
        "selector": "en-slider[label=\"Layer opacity\"] input[type=\"number\"]",
        "value": "72"
      },
      {
        "kind": "press",
        "selector": "en-slider[label=\"Layer opacity\"] input[type=\"number\"]",
        "value": "Enter"
      },
      {
        "kind": "select",
        "selector": "en-select[label=\"Output format\"] select",
        "value": "svg"
      }
    ],
    "checks": [
      {
        "kind": "text",
        "selector": "[data-settings-current]",
        "value": "72"
      },
      {
        "kind": "text",
        "selector": "[data-settings-dirty]",
        "value": "Unsaved local changes"
      }
    ]
  },
  {
    "id": "workflow:settings-commands",
    "page": "settings-commands",
    "state": "menu-open",
    "actions": [
      {
        "kind": "click",
        "selector": "#settings-menu-trigger"
      }
    ],
    "checks": [
      {
        "kind": "visible",
        "selector": "#settings-command-menu [role=\"menu\"][aria-label=\"Settings actions\"]"
      }
    ],
    "capture": "viewport"
  },
  {
    "id": "workflow:settings-commands",
    "page": "settings-commands",
    "state": "no-matching-commands",
    "actions": [
      {
        "kind": "click",
        "selector": "#settings-command-trigger"
      },
      {
        "kind": "fill",
        "selector": "#settings-command-palette input",
        "value": "no-matching-command"
      }
    ],
    "checks": [
      {
        "kind": "visible",
        "selector": "#settings-command-palette [role=\"dialog\"]"
      },
      {
        "kind": "text",
        "selector": "#settings-command-palette [part=\"status\"]",
        "value": "No matching settings commands."
      },
      {
        "kind": "count",
        "selector": "#settings-command-palette [role=\"option\"]",
        "value": 0
      }
    ],
    "capture": "viewport"
  },
  {
    "id": "workflow:settings-validation",
    "page": "settings-validation",
    "state": "invalid-opacity",
    "actions": [
      {
        "kind": "fill",
        "selector": "en-slider[label=\"Layer opacity\"] input[type=\"number\"]",
        "value": "101"
      },
      {
        "kind": "click",
        "selector": "#settings-save-trigger"
      }
    ],
    "checks": [
      {
        "kind": "value",
        "selector": "en-slider[label=\"Layer opacity\"] input[type=\"number\"]",
        "value": "101"
      },
      {
        "kind": "attribute",
        "selector": "en-slider[label=\"Layer opacity\"] input[type=\"number\"]",
        "name": "aria-invalid",
        "value": "true"
      }
    ]
  },
  {
    "id": "workflow:settings-save-retry",
    "page": "settings-save-retry",
    "state": "failed-save",
    "actions": [
      {
        "kind": "fill",
        "selector": "en-slider[label=\"Layer opacity\"] input[type=\"number\"]",
        "value": "72"
      },
      {
        "kind": "press",
        "selector": "en-slider[label=\"Layer opacity\"] input[type=\"number\"]",
        "value": "Enter"
      },
      {
        "kind": "click",
        "selector": "#settings-save-trigger"
      }
    ],
    "checks": [
      {
        "kind": "text",
        "selector": "[data-settings-status]",
        "value": "The simulated save failed."
      }
    ]
  },
  {
    "id": "workflow:settings-save-retry",
    "page": "settings-save-retry",
    "state": "recovered-save",
    "actions": [
      {
        "kind": "fill",
        "selector": "en-slider[label=\"Layer opacity\"] input[type=\"number\"]",
        "value": "72"
      },
      {
        "kind": "press",
        "selector": "en-slider[label=\"Layer opacity\"] input[type=\"number\"]",
        "value": "Enter"
      },
      {
        "kind": "click",
        "selector": "#settings-save-trigger"
      },
      {
        "kind": "click",
        "selector": "#settings-save-trigger:has-text(\"Retry save\")"
      }
    ],
    "checks": [
      {
        "kind": "text",
        "selector": "[data-settings-status]",
        "value": "Saved revision 2."
      }
    ]
  },
  {
    "id": "workflow:settings-pending-save",
    "page": "settings-pending-save",
    "state": "pending-newer-edits",
    "actions": [
      {
        "kind": "fill",
        "selector": "en-slider[label=\"Layer opacity\"] input[type=\"number\"]",
        "value": "72"
      },
      {
        "kind": "press",
        "selector": "en-slider[label=\"Layer opacity\"] input[type=\"number\"]",
        "value": "Enter"
      },
      {
        "kind": "click",
        "selector": "#settings-save-trigger"
      },
      {
        "kind": "select",
        "selector": "en-select[label=\"Output format\"] select",
        "value": "svg"
      }
    ],
    "checks": [
      {
        "kind": "text",
        "selector": "[data-settings-status]",
        "value": "Saving this settings snapshot."
      },
      {
        "kind": "text",
        "selector": "[data-settings-dirty]",
        "value": "Unsaved local changes"
      }
    ]
  },
  {
    "id": "workflow:settings-pending-save",
    "page": "settings-pending-save",
    "state": "delivered-with-newer-edits",
    "actions": [
      {
        "kind": "fill",
        "selector": "en-slider[label=\"Layer opacity\"] input[type=\"number\"]",
        "value": "72"
      },
      {
        "kind": "press",
        "selector": "en-slider[label=\"Layer opacity\"] input[type=\"number\"]",
        "value": "Enter"
      },
      {
        "kind": "click",
        "selector": "#settings-save-trigger"
      },
      {
        "kind": "select",
        "selector": "en-select[label=\"Output format\"] select",
        "value": "svg"
      },
      {
        "kind": "click",
        "selector": "en-button:has-text(\"Deliver held response\")"
      }
    ],
    "checks": [
      {
        "kind": "text",
        "selector": "[data-settings-status]",
        "value": "Newer local changes are still unsaved."
      }
    ]
  },
  {
    "id": "workflow:settings-pending-save",
    "page": "settings-pending-save",
    "state": "cancelled-save",
    "actions": [
      {
        "kind": "fill",
        "selector": "en-slider[label=\"Layer opacity\"] input[type=\"number\"]",
        "value": "72"
      },
      {
        "kind": "press",
        "selector": "en-slider[label=\"Layer opacity\"] input[type=\"number\"]",
        "value": "Enter"
      },
      {
        "kind": "click",
        "selector": "#settings-save-trigger"
      },
      {
        "kind": "click",
        "selector": "en-button:has-text(\"Cancel save\")"
      }
    ],
    "checks": [
      {
        "kind": "text",
        "selector": "[data-settings-status]",
        "value": "Stopped waiting for this save."
      }
    ]
  },
  {
    "id": "workflow:settings-incoming-update",
    "page": "settings-incoming-update",
    "state": "incoming-review",
    "actions": [
      {
        "kind": "select",
        "selector": "en-select[label=\"Settings response delivery\"] select",
        "value": "held"
      },
      {
        "kind": "click",
        "selector": "en-button:has-text(\"Queue collaborator update\")"
      },
      {
        "kind": "click",
        "selector": "en-button:has-text(\"Deliver held response\")"
      }
    ],
    "checks": [
      {
        "kind": "visible",
        "selector": "[aria-label=\"Incoming opacity change\"]"
      }
    ]
  },
  {
    "id": "workflow:settings-incoming-update",
    "page": "settings-incoming-update",
    "state": "incoming-applied",
    "actions": [
      {
        "kind": "select",
        "selector": "en-select[label=\"Settings response delivery\"] select",
        "value": "held"
      },
      {
        "kind": "click",
        "selector": "en-button:has-text(\"Queue collaborator update\")"
      },
      {
        "kind": "click",
        "selector": "en-button:has-text(\"Deliver held response\")"
      },
      {
        "kind": "click",
        "selector": "en-button:has-text(\"Use updated opacity\")"
      }
    ],
    "checks": [
      {
        "kind": "text",
        "selector": "[data-settings-status]",
        "value": "Incoming opacity applied."
      },
      {
        "kind": "text",
        "selector": "[data-settings-current]",
        "value": "82"
      }
    ]
  },
  {
    "id": "workflow:multi-step",
    "page": "multi-step",
    "state": "validation",
    "actions": [
      {
        "kind": "click",
        "selector": "[data-multi-step] en-button:has-text(\"Continue\")"
      }
    ],
    "checks": [
      {
        "kind": "count",
        "selector": "#brief-errors a",
        "value": 2
      },
      {
        "kind": "visible",
        "selector": "#brief-errors a[href=\"#brief-title\"]"
      },
      {
        "kind": "visible",
        "selector": "#brief-errors a[href=\"#brief-email\"]"
      }
    ]
  },
  {
    "id": "workflow:multi-step",
    "page": "multi-step",
    "state": "review-date",
    "actions": [
      {
        "kind": "fill",
        "selector": "#brief-title input",
        "value": "Review study"
      },
      {
        "kind": "fill",
        "selector": "#brief-email input",
        "value": "review@example.com"
      },
      {
        "kind": "click",
        "selector": "[data-multi-step] en-button:has-text(\"Continue\")"
      }
    ],
    "checks": [
      {
        "kind": "text",
        "selector": "[data-step-heading]",
        "value": "Step 2 of 3"
      },
      {
        "kind": "visible",
        "selector": "#brief-date input"
      }
    ]
  },
  {
    "id": "workflow:multi-step",
    "page": "multi-step",
    "state": "confirm-brief",
    "actions": [
      {
        "kind": "fill",
        "selector": "#brief-title input",
        "value": "Review study"
      },
      {
        "kind": "fill",
        "selector": "#brief-email input",
        "value": "review@example.com"
      },
      {
        "kind": "click",
        "selector": "[data-multi-step] en-button:has-text(\"Continue\")"
      },
      {
        "kind": "click",
        "selector": "[data-multi-step] en-button:has-text(\"Continue\")"
      }
    ],
    "checks": [
      {
        "kind": "text",
        "selector": "[data-step-heading]",
        "value": "Step 3 of 3"
      }
    ]
  },
  {
    "id": "workflow:multi-step",
    "page": "multi-step",
    "state": "failed-save",
    "actions": [
      {
        "kind": "fill",
        "selector": "#brief-title input",
        "value": "Review study"
      },
      {
        "kind": "fill",
        "selector": "#brief-email input",
        "value": "review@example.com"
      },
      {
        "kind": "click",
        "selector": "[data-multi-step] en-button:has-text(\"Continue\")"
      },
      {
        "kind": "click",
        "selector": "[data-multi-step] en-button:has-text(\"Continue\")"
      },
      {
        "kind": "click",
        "selector": "[data-multi-step] en-button:has-text(\"Create brief\")"
      }
    ],
    "checks": [
      {
        "kind": "visible",
        "selector": "[data-save-error]"
      },
      {
        "kind": "text",
        "selector": "[data-save-error]",
        "value": "The brief could not be saved."
      }
    ]
  },
  {
    "id": "workflow:selection",
    "page": "selection",
    "state": "empty-query",
    "actions": [
      {
        "kind": "click",
        "selector": "[data-workflow=\"selection\"] en-combobox input"
      },
      {
        "kind": "fill",
        "selector": "[data-workflow=\"selection\"] en-combobox input",
        "value": "no-matching-project"
      }
    ],
    "checks": [
      {
        "kind": "visible",
        "selector": "[data-workflow=\"selection\"] en-combobox [part=\"status\"]"
      },
      {
        "kind": "text",
        "selector": "[data-workflow=\"selection\"] en-combobox [part=\"status\"]",
        "value": "No matching options."
      },
      {
        "kind": "text",
        "selector": "[data-selection-accepted]",
        "value": "project-01"
      }
    ],
    "capture": "viewport"
  },
  {
    "id": "workflow:multi-step",
    "page": "multi-step",
    "state": "recovered-save",
    "actions": [
      {
        "kind": "fill",
        "selector": "#brief-title input",
        "value": "Review study"
      },
      {
        "kind": "fill",
        "selector": "#brief-email input",
        "value": "review@example.com"
      },
      {
        "kind": "click",
        "selector": "[data-multi-step] en-button:has-text(\"Continue\")"
      },
      {
        "kind": "click",
        "selector": "[data-multi-step] en-button:has-text(\"Continue\")"
      },
      {
        "kind": "click",
        "selector": "[data-multi-step] en-button:has-text(\"Create brief\")"
      },
      {
        "kind": "click",
        "selector": "[data-save-error]:visible"
      },
      {
        "kind": "click",
        "selector": "[data-multi-step] summary:has-text(\"Review scenarios\")"
      },
      {
        "kind": "click",
        "selector": "[data-multi-step] en-checkbox:has-text(\"Simulate save failure\")"
      },
      {
        "kind": "click",
        "selector": "[data-multi-step] en-button:has-text(\"Try again\")"
      }
    ],
    "checks": [
      {
        "kind": "text",
        "selector": "[data-step-heading]",
        "value": "Project brief created"
      },
      {
        "kind": "value",
        "selector": "#brief-title input",
        "value": "Review study"
      }
    ]
  },
  {
    "id": "workflow:selection",
    "page": "selection",
    "state": "submitted-selection",
    "actions": [
      {
        "kind": "click",
        "selector": "[data-workflow=\"selection\"] en-combobox input"
      },
      {
        "kind": "fill",
        "selector": "[data-workflow=\"selection\"] en-combobox input",
        "value": "Willow \u00b7 Year in review"
      },
      {
        "kind": "click",
        "selector": "[data-workflow=\"selection\"] en-combobox [role=\"option\"]:has-text(\"Willow \u00b7 Year in review\")"
      },
      {
        "kind": "click",
        "selector": "[data-workflow=\"selection\"] en-button:has-text(\"Assign brief\")"
      }
    ],
    "checks": [
      {
        "kind": "text",
        "selector": "[data-selection-accepted]",
        "value": "project-40"
      },
      {
        "kind": "text",
        "selector": "[data-selection-submission]",
        "value": "project=project-40"
      }
    ]
  },
  {
    "id": "workflow:selection",
    "page": "selection",
    "state": "dismissed-query",
    "actions": [
      {
        "kind": "click",
        "selector": "[data-workflow=\"selection\"] en-combobox input"
      },
      {
        "kind": "fill",
        "selector": "[data-workflow=\"selection\"] en-combobox input",
        "value": "no-matching-project"
      },
      {
        "kind": "press",
        "selector": "[data-workflow=\"selection\"] en-combobox input",
        "value": "Escape"
      }
    ],
    "checks": [
      {
        "kind": "value",
        "selector": "[data-workflow=\"selection\"] en-combobox input",
        "value": "Studio North \u00b7 Autumn campaign"
      },
      {
        "kind": "text",
        "selector": "[data-selection-accepted]",
        "value": "project-01"
      },
      {
        "kind": "hidden",
        "selector": "[data-workflow=\"selection\"] en-combobox [part=\"popup\"]"
      }
    ]
  },
  {
    "id": "workflow:chat",
    "page": "chat",
    "state": "preview-adjustment",
    "actions": [
      {
        "kind": "click",
        "selector": "[data-workflow=\"chat\"] [data-testid=\"chat-qa\"] summary"
      },
      {
        "kind": "select",
        "selector": "[data-workflow=\"chat\"] [data-testid=\"chat-qa\"] en-select[label=\"Response timing\"] select",
        "value": "immediate"
      },
      {
        "kind": "click",
        "selector": "[data-workflow=\"chat\"] [data-testid=\"chat-send\"]"
      },
      {
        "kind": "click",
        "selector": "[data-workflow=\"chat\"] [data-testid=\"chat-adjustment\"] en-button:has-text(\"Preview adjustment\")"
      }
    ],
    "checks": [
      {
        "kind": "text",
        "selector": "[data-workflow=\"chat\"] [data-testid=\"chat-status\"]",
        "value": "Preview ready: 85% opacity"
      },
      {
        "kind": "text",
        "selector": "[data-workflow=\"chat\"] [data-testid=\"chat-current\"]",
        "value": "Current: 68% opacity"
      }
    ]
  },
  {
    "id": "workflow:chat",
    "page": "chat",
    "state": "applied-adjustment",
    "actions": [
      {
        "kind": "click",
        "selector": "[data-workflow=\"chat\"] [data-testid=\"chat-qa\"] summary"
      },
      {
        "kind": "select",
        "selector": "[data-workflow=\"chat\"] [data-testid=\"chat-qa\"] en-select[label=\"Response timing\"] select",
        "value": "immediate"
      },
      {
        "kind": "click",
        "selector": "[data-workflow=\"chat\"] [data-testid=\"chat-send\"]"
      },
      {
        "kind": "click",
        "selector": "[data-workflow=\"chat\"] [data-testid=\"chat-adjustment\"] en-button:has-text(\"Preview adjustment\")"
      },
      {
        "kind": "click",
        "selector": "[data-workflow=\"chat\"] [data-testid=\"chat-adjustment\"] en-button:has-text(\"Apply adjustment\")"
      }
    ],
    "checks": [
      {
        "kind": "text",
        "selector": "[data-workflow=\"chat\"] [data-testid=\"chat-status\"]",
        "value": "Adjustment applied. Cover image opacity is 85%."
      },
      {
        "kind": "text",
        "selector": "[data-workflow=\"chat\"] [data-testid=\"chat-current\"]",
        "value": "Current: 85% opacity"
      }
    ]
  },
  {
    "id": "workflow:chat",
    "page": "chat",
    "state": "cancelled-adjustment",
    "actions": [
      {
        "kind": "click",
        "selector": "[data-workflow=\"chat\"] [data-testid=\"chat-qa\"] summary"
      },
      {
        "kind": "select",
        "selector": "[data-workflow=\"chat\"] [data-testid=\"chat-qa\"] en-select[label=\"Response timing\"] select",
        "value": "immediate"
      },
      {
        "kind": "click",
        "selector": "[data-workflow=\"chat\"] [data-testid=\"chat-send\"]"
      },
      {
        "kind": "click",
        "selector": "[data-workflow=\"chat\"] [data-testid=\"chat-adjustment\"] en-button:has-text(\"Preview adjustment\")"
      },
      {
        "kind": "click",
        "selector": "[data-workflow=\"chat\"] [data-testid=\"chat-adjustment\"] en-button:has-text(\"Cancel adjustment\")"
      }
    ],
    "checks": [
      {
        "kind": "text",
        "selector": "[data-workflow=\"chat\"] [data-testid=\"chat-status\"]",
        "value": "Adjustment canceled. The image is unchanged."
      },
      {
        "kind": "text",
        "selector": "[data-workflow=\"chat\"] [data-testid=\"chat-current\"]",
        "value": "Current: 68% opacity"
      }
    ]
  },
  {
    "id": "workflow:chat",
    "page": "chat",
    "state": "failed-message",
    "actions": [
      {
        "kind": "click",
        "selector": "[data-workflow=\"chat\"] [data-testid=\"chat-qa\"] summary"
      },
      {
        "kind": "select",
        "selector": "[data-workflow=\"chat\"] [data-testid=\"chat-qa\"] en-select[label=\"Response timing\"] select",
        "value": "immediate"
      },
      {
        "kind": "select",
        "selector": "[data-workflow=\"chat\"] [data-testid=\"chat-qa\"] en-select[label=\"Next reply\"] select",
        "value": "fail-once"
      },
      {
        "kind": "click",
        "selector": "[data-workflow=\"chat\"] [data-testid=\"chat-send\"]"
      }
    ],
    "checks": [
      {
        "kind": "visible",
        "selector": "[data-workflow=\"chat\"] en-button:has-text(\"Retry message\")"
      }
    ]
  },
  {
    "id": "workflow:chat",
    "page": "chat",
    "state": "retry-preserves-draft",
    "actions": [
      {
        "kind": "click",
        "selector": "[data-workflow=\"chat\"] [data-testid=\"chat-qa\"] summary"
      },
      {
        "kind": "select",
        "selector": "[data-workflow=\"chat\"] [data-testid=\"chat-qa\"] en-select[label=\"Response timing\"] select",
        "value": "immediate"
      },
      {
        "kind": "select",
        "selector": "[data-workflow=\"chat\"] [data-testid=\"chat-qa\"] en-select[label=\"Next reply\"] select",
        "value": "fail-once"
      },
      {
        "kind": "click",
        "selector": "[data-workflow=\"chat\"] [data-testid=\"chat-send\"]"
      },
      {
        "kind": "fill",
        "selector": "[data-workflow=\"chat\"] [data-testid=\"chat-composer\"] textarea",
        "value": "A newer draft stays here."
      },
      {
        "kind": "click",
        "selector": "[data-workflow=\"chat\"] en-button:has-text(\"Retry message\")"
      }
    ],
    "checks": [
      {
        "kind": "visible",
        "selector": "[data-workflow=\"chat\"] [data-testid=\"chat-adjustment\"]"
      },
      {
        "kind": "value",
        "selector": "[data-workflow=\"chat\"] [data-testid=\"chat-composer\"] textarea",
        "value": "A newer draft stays here."
      }
    ]
  }
];
