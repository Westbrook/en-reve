/** Private native surfaces alone own this inert state; authored children stay untouched. */
export function setNativeSurfaceOpen(surface: HTMLElement, open: boolean): void {
  if (surface.inert === open) surface.inert = !open;
}

/**
 * Native close/focus steps run synchronously after beforetoggle. Apply inert only
 * after those steps, then consult actual state so a same-turn reopen wins. There
 * is no transition listener, timeout, delayed modality or animation completion.
 */
export function nativeSurfaceBeforeToggle(event: ToggleEvent): void {
  const surface = event.currentTarget as HTMLElement;
  if (event.target !== surface) return;
  if (event.newState === 'open') setNativeSurfaceOpen(surface, true);
  queueMicrotask(() => {
    if (!surface.isConnected) return;
    const open = surface.localName === 'dialog'
      ? (surface as HTMLDialogElement).open : surface.matches(':popover-open');
    setNativeSurfaceOpen(surface, open);
  });
}
