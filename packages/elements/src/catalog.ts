import {tagDefinition} from './definitions/tag.js';
import {mediaViewerDefinition} from './definitions/media-viewer.js';
import {chartDefinition} from './definitions/chart.js';
import {transcriptDefinition} from './definitions/transcript.js';
import {questionnaireDefinition} from './definitions/questionnaire.js';
import {queryBuilderDefinition} from './definitions/query-builder.js';
import {sheetDefinition} from './definitions/sheet.js';
import {menubarDefinition} from './definitions/menubar.js';
import {actionOverflowDefinition} from './definitions/action-overflow.js';
import {selectionCollectionDefinition} from './definitions/selection-collection.js';
import {hoverCardDefinition} from './definitions/hover-card.js';
import {otpFieldDefinition} from './definitions/otp-field.js';
import {rangeSliderDefinition} from './definitions/range-slider.js';
import {contextMenuDefinition} from './definitions/context-menu.js';
import {choiceOptionDefinition} from './definitions/choice-option.js';
import {multiselectDefinition} from './definitions/multiselect.js';
import {checkboxGroupDefinition} from './definitions/checkbox-group.js';
import {toggleGroupDefinition} from './definitions/toggle-group.js';
import {toggleButtonDefinition} from './definitions/toggle-button.js';
import {dataTableDefinition} from './definitions/data-table.js';
import {activityFeedDefinition} from './definitions/activity-feed.js';
import {activityItemDefinition} from './definitions/activity-item.js';
import {presenceGroupDefinition} from './definitions/presence-group.js';
import {presenceDefinition} from './definitions/presence.js';
import {chatMessageDefinition} from './definitions/chat-message.js';
import {tokenEditorDefinition} from './definitions/token-editor.js';
import {editorTriggerDefinition} from './definitions/editor-trigger.js';
import {chatComposerDefinition} from './definitions/chat-composer.js';
import {toastDefinition} from './definitions/toast.js';
import {toastRegionDefinition} from './definitions/toast-region.js';
import {navigationGroupDefinition} from './definitions/navigation-group.js';
import {carouselSlideDefinition} from './definitions/carousel-slide.js';
import {richTextEditorDefinition} from './definitions/rich-text-editor.js';
import {editorToolbarDefinition} from './definitions/editor-toolbar.js';
import {carouselDefinition} from './definitions/carousel.js';
import {validationSummaryDefinition} from './definitions/validation-summary.js';
import {progressStepsDefinition} from './definitions/progress-steps.js';
import {progressStepDefinition} from './definitions/progress-step.js';
import {fileUploadDefinition} from './definitions/file-upload.js';
import {treeDefinition} from './definitions/tree.js';
import {treeItemDefinition} from './definitions/tree-item.js';
import {swatchDefinition} from './definitions/swatch.js';
import {buttonDefinition} from './definitions/button.js';
import {toolbarDefinition} from './definitions/toolbar.js';
import {menuDefinition} from './definitions/menu.js';
import {menuItemDefinition} from './definitions/menu-item.js';
import {commandPaletteDefinition} from './definitions/command-palette.js';
import {linkDefinition} from './definitions/link.js';
import {navigationDefinition} from './definitions/navigation.js';
import {breadcrumbsDefinition} from './definitions/breadcrumbs.js';
import {tableDefinition} from './definitions/table.js';
import {paginationDefinition} from './definitions/pagination.js';
import {cardDefinition} from './definitions/card.js';
import {badgeDefinition} from './definitions/badge.js';
import {avatarDefinition} from './definitions/avatar.js';
import {iconDefinition} from './definitions/icon.js';
import {alertDefinition} from './definitions/alert.js';
import {progressBarDefinition} from './definitions/progress-bar.js';
import {spinnerDefinition} from './definitions/spinner.js';
import {skeletonDefinition} from './definitions/skeleton.js';
import {stackDefinition} from './definitions/stack.js';
import {textFieldDefinition} from './definitions/text-field.js';
import {textareaDefinition} from './definitions/textarea.js';
import {searchInputDefinition} from './definitions/search-input.js';
import {timeFieldDefinition} from './definitions/time-field.js';
import {dateInputDefinition} from './definitions/date-input.js';
import {calendarDefinition} from './definitions/calendar.js';
import {datePickerDefinition} from './definitions/date-picker.js';
import {selectDefinition} from './definitions/select.js';
import {selectOptionDefinition} from './definitions/select-option.js';
import {comboboxDefinition} from './definitions/combobox.js';
import {numberFieldDefinition} from './definitions/number-field.js';
import {checkboxDefinition} from './definitions/checkbox.js';
import {switchDefinition} from './definitions/switch.js';
import {radioDefinition} from './definitions/radio.js';
import {radioGroupDefinition} from './definitions/radio-group.js';
import {sliderDefinition} from './definitions/slider.js';
import {ratingDefinition} from './definitions/rating.js';
import {accordionDefinition} from './definitions/accordion.js';
import {accordionItemDefinition} from './definitions/accordion-item.js';
import {tabsDefinition} from './definitions/tabs.js';
import {tabDefinition} from './definitions/tab.js';
import {tabPanelDefinition} from './definitions/tab-panel.js';
import {splitViewDefinition} from './definitions/split-view.js';
import {splitterDefinition} from './definitions/splitter.js';
import {dialogDefinition} from './definitions/dialog.js';
import {drawerDefinition} from './definitions/drawer.js';
import {popoverDefinition} from './definitions/popover.js';
import {tooltipDefinition} from './definitions/tooltip.js';
import {colorFieldDefinition} from './definitions/color-field.js';
import {colorSliderDefinition} from './definitions/color-slider.js';
import {colorWheelDefinition} from './definitions/color-wheel.js';
import {colorPlaneDefinition} from './definitions/color-plane.js';
import {colorPickerDefinition} from './definitions/color-picker.js';
import {segmentedControlDefinition} from './definitions/segmented-control.js';
import {segmentedItemDefinition} from './definitions/segmented-item.js';
import {registerDefinitions} from '@en-reve/primitives/interactions/registration.js';

/** All catalog roots, including explicitly authored children. No registration on import. */
export const definitions = [
  tagDefinition,
  mediaViewerDefinition,
  chartDefinition,
  transcriptDefinition,
  questionnaireDefinition,
  queryBuilderDefinition,
  sheetDefinition,
  menubarDefinition,
  actionOverflowDefinition,
  selectionCollectionDefinition,
  hoverCardDefinition,
  otpFieldDefinition,
  rangeSliderDefinition,
  contextMenuDefinition,
  choiceOptionDefinition,
  multiselectDefinition,
  checkboxGroupDefinition,
  toggleGroupDefinition,
  toggleButtonDefinition,
  dataTableDefinition,
  activityFeedDefinition,
  activityItemDefinition,
  presenceGroupDefinition,
  presenceDefinition,
  chatMessageDefinition,
  tokenEditorDefinition,
  editorTriggerDefinition,
  chatComposerDefinition,
  toastDefinition,
  toastRegionDefinition,
  navigationGroupDefinition,
  carouselSlideDefinition,
  richTextEditorDefinition,
  editorToolbarDefinition,
  carouselDefinition,
  validationSummaryDefinition,
  progressStepsDefinition,
  progressStepDefinition,
  fileUploadDefinition,
  treeDefinition,
  treeItemDefinition,
  swatchDefinition,
  buttonDefinition,
  toolbarDefinition,
  menuDefinition,
  menuItemDefinition,
  commandPaletteDefinition,
  linkDefinition,
  navigationDefinition,
  breadcrumbsDefinition,
  tableDefinition,
  paginationDefinition,
  cardDefinition,
  badgeDefinition,
  avatarDefinition,
  iconDefinition,
  alertDefinition,
  progressBarDefinition,
  spinnerDefinition,
  skeletonDefinition,
  stackDefinition,
  textFieldDefinition,
  textareaDefinition,
  searchInputDefinition,
  timeFieldDefinition,
  dateInputDefinition,
  calendarDefinition,
  datePickerDefinition,
  selectDefinition,
  selectOptionDefinition,
  comboboxDefinition,
  numberFieldDefinition,
  checkboxDefinition,
  switchDefinition,
  radioDefinition,
  radioGroupDefinition,
  sliderDefinition,
  ratingDefinition,
  accordionDefinition,
  accordionItemDefinition,
  tabsDefinition,
  tabDefinition,
  tabPanelDefinition,
  splitViewDefinition,
  splitterDefinition,
  dialogDefinition,
  drawerDefinition,
  popoverDefinition,
  tooltipDefinition,
  colorFieldDefinition,
  colorSliderDefinition,
  colorWheelDefinition,
  colorPlaneDefinition,
  colorPickerDefinition,
  segmentedControlDefinition,
  segmentedItemDefinition,
] as const;

/** Explicit catalog registration for documentation and specimen applications. */
export function registerAll(registry: CustomElementRegistry = customElements): void {
  registerDefinitions(registry, definitions);
}
