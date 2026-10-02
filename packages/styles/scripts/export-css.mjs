import { writeFile } from 'node:fs/promises';

const families = {
  patterns: ['patternStyles'],
  carousel: ['carouselStyles','carouselSlideStyles'],
  toast: ['toastStyles'],
  chat: ['chatStyles'],
  collaboration: ['collaborationStyles'],
  'form-navigation': ['formNavigationStyles'],
  'color-wheel': ['colorWheelStyles'],
  'color-slider': ['colorSliderStyles'],
  'color-picker': ['colorPickerStyles', 'colorPlaneStyles'],
  calendar: ['calendarStyles'],
  foundations: ['foundationStyles', 'typographyStyles'],
  typography: ['typographyStyles'],
  controls: ['controlStyles', 'formStyles', 'selectEnhancementStyles'],
  buttons: ['buttonStyles'],
  links: ['linkStyles'],
  radio: ['radioStyles'],
  combobox: ['comboboxStyles'],
  commands: ['menuStyles', 'menuItemStyles', 'toolbarStyles', 'commandPaletteStyles'],
  selection: ['selectionStyles'],
  surfaces: ['surfaceStyles', 'layoutStyles'],
  overlays: ['overlayStyles'],
  feedback: ['feedbackStyles', 'mediaStyles', 'swatchNativeStyles'],
  activity: ['activityStyles'],
  recipes: ['recipeStyles'],
  content: ['contentStyles'],
  navigation: ['navigationStyles'],
  table: ['tableStyles'],
  pagination: ['paginationStyles'],
  tree: ['treeStyles', 'treeItemStyles'],
  'file-upload': ['fileUploadStyles'],
};

for (const [family, names] of Object.entries(families)) {
  const module = await import(new URL(`../dist/${family}.js`, import.meta.url));
  const content = names.map((name) => module[name].cssText).join('\n');
  await writeFile(new URL(`../dist/${family}.css`, import.meta.url), `/* Generated from @en-reve/styles/${family}.js; do not edit. */\n${content}\n`);
}
