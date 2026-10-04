/** Type-only contract shared by the browser fixture and its Playwright owner. */
export interface SliderPresentationFixture {
  sync(input: HTMLInputElement): void;
  connect(input: HTMLInputElement): void;
}

declare global {
  interface Window { sliderPresentationFixture: SliderPresentationFixture; }
}
