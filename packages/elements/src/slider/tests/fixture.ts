import { EnSlider } from '../index.js';
import { EnRangeSlider } from '../../range-slider.js';
import { foundationStyles } from '@en-reve/styles/foundations.js';
import { controlStyles } from '@en-reve/styles/controls.js';
import { syncRangePresentation } from '@en-reve/primitives/interactions/range-presentation.js';
import type { SliderPresentationFixture } from './presentation-fixture.js';

const nativeStyles = new CSSStyleSheet();
nativeStyles.replaceSync(foundationStyles.cssText + controlStyles.cssText);
document.adoptedStyleSheets = [...document.adoptedStyleSheets, nativeStyles];

// Native recipe consumers explicitly own initialization and subsequent updates.
// This fixture deliberately does not observe property writes or attach globally.
const presentationFixture: SliderPresentationFixture = {
  sync: syncRangePresentation,
  connect(input: HTMLInputElement) {
    syncRangePresentation(input);
    input.addEventListener('input', () => syncRangePresentation(input));
    input.form?.addEventListener('reset', () => {
      // Native reset's default action completes after its cancelable event.
      setTimeout(() => syncRangePresentation(input), 0);
    });
  },
};
window.sliderPresentationFixture = presentationFixture;

customElements.define('en-slider', EnSlider);
customElements.define('en-range-slider', EnRangeSlider);
