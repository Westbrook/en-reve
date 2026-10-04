import { authorPaint, declarations, nativeSurface, type CompanionPresentationContext, type CompanionPresentationRegistry } from './presentation.js';
import { sourceSizedRoles, sourceSizedValue } from './astryx.js';

/** Both hosts retain their native/transactional state owners. Only documented
 * surfaces receive private fallback values; public local hooks keep precedence. */
export const sliderTargets = { 'source-slider': ['en-slider', 'en-range-slider', '.en-range'] } as const;

const paintRoles = {
  trackBackground: 'color', fillBackground: 'color', trackShadow: 'shadow',
  hoverFillBackground: 'color', pressedFillBackground: 'color', hoverThumbBackground: 'color', pressedThumbBackground: 'color',
  hoverPressedFillBackground: 'color', hoverPressedThumbBackground: 'color', hoverThumbBorderColor: 'color', pressedThumbBorderColor: 'color', thumbRimColor: 'color',
  thumbBackground: 'color', thumbBorderColor: 'color', thumbShadow: 'shadow',
  thumbHoverShadow: 'shadow', thumbFocusShadow: 'shadow',
  disabledTrackBackground: 'color', disabledFillBackground: 'color',
  disabledTrackShadow: 'shadow', disabledThumbBackground: 'color', disabledThumbBorderColor: 'color', disabledThumbShadow: 'shadow',
} as const;
const geometryRoles = { trackRadius: 'dimension', thumbRadius: 'dimension', thumbBorderWidth: 'dimension', paintDuration: 'duration', disabledFillOpacity: 'number', disabledOpacity: 'number', disabledThumbOpacity: 'number' } as const;
function surface(ctx: CompanionPresentationContext, css: string): string {
  if (!css) return '';
  // Re-evaluate derived rim geometry on each endpoint too: a public local border
  // override on one thumb must not inherit compensation computed on the track.
  return ctx.style([
    `${ctx.selectors[0]}::part(control)`, `${ctx.selectors[1]}::part(track)`,
    `${ctx.selectors[1]}::part(lower-thumb)`, `${ctx.selectors[1]}::part(upper-thumb)`,
    nativeSurface(ctx.selectors[2]),
  ], css);
}
const property = (role: string) => `--_en-source-slider-${role.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)}`;

export const sliderPresentations = {
  'source-slider': {
    filled: {
      roles: { ...sourceSizedRoles('trackSize'), ...sourceSizedRoles('thumbSize'), ...sourceSizedRoles('thumbBorderWidth'), ...sourceSizedRoles('thumbRimWidth'), ...geometryRoles, ...paintRoles },
      render(ctx) {
        const borderWidth = sourceSizedValue(ctx, 'thumbBorderWidth') ?? ctx.role('thumbBorderWidth');
        const rimWidth = sourceSizedValue(ctx, 'thumbRimWidth');
        const rimColor = ctx.role('thumbRimColor');
        const sourceShadow = ctx.role('thumbShadow');
        const rimShadow = rimWidth && rimColor
          ? `inset 0 0 0 max(0px, calc(${rimWidth} - var(--en-slider-thumb-border-width, ${borderWidth ?? 'var(--en-border-width)'}))) ${rimColor}${sourceShadow ? `, ${sourceShadow}` : ''}`
          : sourceShadow;
        return surface(ctx, declarations({
          ...Object.fromEntries(Object.keys(geometryRoles).map(role => [property(role), ctx.role(role)])),
          '--_en-source-slider-track-size': sourceSizedValue(ctx, 'trackSize'),
          '--_en-source-slider-thumb-size': sourceSizedValue(ctx, 'thumbSize'),
          '--_en-source-slider-thumb-border-width': borderWidth,
        })) + authorPaint(surface(ctx, declarations({...Object.fromEntries(Object.keys(paintRoles).map(role => [property(role), ctx.role(role)])), '--_en-source-slider-thumb-shadow': rimShadow})));
      },
    },
  },
} as const satisfies CompanionPresentationRegistry;
