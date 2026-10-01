import { EnTextField } from '../../text-field/element.js';
import { EnTextarea } from '../../textarea/element.js';
import { EnSearchInput } from '../../search-input/element.js';
import { EnDateInput } from '../../date-input/element.js';
import { EnSelect } from '../../select/element.js';
import { EnNumberField } from '../../number-field/element.js';
import { EnColorField } from '../../color-field/element.js';
import { EnCheckbox } from '../../checkbox/index.js';
import { EnSwitch } from '../../switch/index.js';
import { EnRadio } from '../../radio/index.js';
import { EnRadioGroup } from '../../radio-group/index.js';
import { EnSegmentedControl } from '../../segmented-control/index.js';
import { EnSlider } from '../../slider/index.js';
import { EnRating } from '../../rating/index.js';

for (const [name, constructor] of [
  ['en-text-field', EnTextField], ['en-textarea', EnTextarea], ['en-search-input', EnSearchInput],
  ['en-date-input', EnDateInput], ['en-select', EnSelect], ['en-number-field', EnNumberField],
  ['en-color-field', EnColorField], ['en-checkbox', EnCheckbox], ['en-switch', EnSwitch],
  ['en-radio', EnRadio], ['en-radio-group', EnRadioGroup], ['en-segmented-control', EnSegmentedControl],
  ['en-slider', EnSlider], ['en-rating', EnRating],
] as const) customElements.define(name, constructor);
/** A consumer's assigned element can have no light-DOM text yet provide visible shadow content. */
class DescriptionHelp extends HTMLElement {
  private readonly text = document.createTextNode('Guidance from a shadow tree.');
  constructor() { super(); this.attachShadow({ mode: 'open' }).append(this.text); }
  set message(value: string) { this.text.data = value; }
}
customElements.define('test-description-help', DescriptionHelp);
document.body.dataset.ready = 'true';
