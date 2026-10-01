import { EnCheckbox } from './index.ts';
import { EnSwitch } from '../switch/index.ts';
import { EnRadio } from '../radio/index.ts';
import { EnRadioGroup } from '../radio-group/index.ts';
import { EnSlider } from '../slider/index.ts';
import { EnRating } from '../rating/index.ts';
import { EnSegmentedControl } from '../segmented-control/index.ts';
for (const [name, constructor] of Object.entries({
  'en-checkbox': EnCheckbox, 'en-switch': EnSwitch, 'en-radio': EnRadio,
  'en-radio-group': EnRadioGroup, 'en-slider': EnSlider, 'en-rating': EnRating,
  'en-segmented-control': EnSegmentedControl,
})) customElements.define(name, constructor);
document.querySelector('en-segmented-control').items = [
  { value: 'light', label: 'Light' }, { value: 'system', label: 'System', disabled: true },
  { value: 'dark', label: 'Dark' }, { value: 'dim', label: 'Dim' },
];
