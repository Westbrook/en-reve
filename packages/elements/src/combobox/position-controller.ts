import {PopupMeasurement,calibratedOrigin,translatedRect,viewportBounds,verticalSpace,popupFit} from '../internal/popup-measurement.js';
import type { ReactiveController, ReactiveControllerHost } from 'lit';

export type PopupPresentation = 'pending' | 'visible' | 'suspended';
export type SuspensionReason = 'no-room' | 'offscreen' | 'unmeasured';

export interface PositionOptions {
  anchor(): HTMLInputElement | null;
  popup(): HTMLElement | null;
  open(): boolean;
  resized(): void;
  presented(state: PopupPresentation, reason?: SuspensionReason): void;
}

/** Only positions an already-open native manual popover; it never owns selection or focus. */
export class ComboboxPositionController implements ReactiveController {
  private connected = false;
  private anchor: HTMLInputElement | null = null;
  private popup: HTMLElement | null = null;
  private measurement?: PopupMeasurement;
  private view?: Window;
  private geometry = '';
  private originX?: number;
  private originY?: number;
  private presented: PopupPresentation | undefined;
  private reason: SuspensionReason | undefined;

  constructor(private readonly host: ReactiveControllerHost, private readonly options: PositionOptions) { host.addController(this); }
  hostConnected(): void { this.connected = true; }
  hostDisconnected(): void { this.connected = false; this.stop(); }
  hostUpdated(): void { this.sync(); }
  sync(): void {
    const anchor = this.options.anchor();
    const popup = this.options.popup();
    if (!this.connected || !this.options.open() || !anchor || !popup || typeof popup.showPopover !== 'function' || !popup.matches(':popover-open')) { this.stop(this.connected && !this.options.open()); return; }
    if (anchor !== this.anchor || popup !== this.popup) {
      this.stop();
      this.anchor = anchor; this.popup = popup;
      popup.style.setProperty('--_en-combobox-visibility', 'hidden');
      const view = anchor.ownerDocument.defaultView;
      if (!view) return;
      this.view = view;
      this.measurement=new PopupMeasurement(anchor,popup,()=>this.connected&&this.options.open(),()=>this.position());
    }
    this.schedule();
  }
  private readonly schedule=():void=>{this.measurement?.schedule();};
  private position(): void {
    const anchor = this.anchor;
    const popup = this.popup;
    const view = this.view;
    if (!anchor?.isConnected || !popup?.isConnected || !view || typeof popup.showPopover !== 'function' || !popup.matches(':popover-open')) return;
    // Read both boxes before writing. Subsequent observer work is coalesced into one frame.
    const anchorRect = anchor.getBoundingClientRect();
    const popupRect = popup.getBoundingClientRect();
    const popupHeight = popupRect.height;
    const naturalHeight = popup.scrollHeight + popup.offsetHeight - popup.clientHeight;
    const style = view.getComputedStyle(popup);
    // Client rectangles and fixed-position CSS can have different origins while
    // a mobile visual viewport is panned. Measure that origin using this existing
    // fixed top-layer surface, rather than assuming a particular browser engine.
    this.originX=calibratedOrigin(style.left,popupRect.left,this.originX);
    this.originY=calibratedOrigin(style.top,popupRect.top,this.originY);
    const rect=translatedRect(anchorRect,this.originX,this.originY);
    const gap = parseFloat(style.rowGap) || 0;
    // Measure content in place even while suspended. Never replace the editor or
    // move document scroll just to make space for the suggestion surface.
    const row = popup.querySelector<HTMLElement>('[role="option"][data-active]')
      ?? popup.querySelector<HTMLElement>('[role="option"]')
      ?? popup.querySelector<HTMLElement>('[role="status"]');
    const rowHeight = row?.getBoundingClientRect().height ?? 0;
    const chrome = [style.paddingTop, style.paddingBottom, style.borderTopWidth, style.borderBottomWidth]
      .reduce((sum, value) => sum + (parseFloat(value) || 0), 0);
    const minimumHeight = rowHeight + chrome;
    const {top,left,width,height}=viewportBounds(view);
    const {below,above,useAbove}=verticalSpace(rect,{top,height},gap,naturalHeight);
    const available = useAbove ? above : below;
    const intersects = rect.width > 0 && rect.height > 0 && rect.right > left && rect.left < left + width
      && rect.bottom > top && rect.top < top + height;
    // A thin sliver of a result is not a usable popup. Retain open intent and
    // native draft so keyboard/viewport motion can restore the same surface.
    const popupWidth = `${Math.min(rect.width, width)}px`;
    const widthChanged = popup.style.getPropertyValue('--_en-combobox-width') !== popupWidth;
    const heightChanged = popup.style.getPropertyValue('--_en-combobox-max-height') !== `${available}px`;
    // A narrower width can wrap a row. Read its resulting height on the next
    // frame; an authored CSS height ceiling must also fit the measured row.
    const {presented,state:fitState,reason}=popupFit({widthChanged,heightChanged,intersects,width,height,rowHeight,available,minimumHeight,popupHeight});
    const presentation:PopupPresentation=fitState;
    const values = {
      '--_en-combobox-x': `${Math.max(left, Math.min(rect.left, left + width - Math.min(rect.width, width)))}px`,
      // Keep the chosen edge attached to the input. A global viewport clamp can
      // pull a below-input surface across its editor using the previous height.
      '--_en-combobox-y': `${useAbove ? rect.top - gap - Math.min(popupHeight, available) : rect.bottom + gap}px`,
      '--_en-combobox-width': popupWidth,
      '--_en-combobox-max-height': `${available}px`,
      '--_en-combobox-visibility': presented ? 'visible' : 'hidden',
    };
    for (const [name, value] of Object.entries(values)) if (popup.style.getPropertyValue(name) !== value) popup.style.setProperty(name, value);
    if (widthChanged || heightChanged) this.schedule();
    this.setPresented(presentation, reason);
    // Placement or size changes can clip the active row after it was revealed.
    // Ordinary popup scrolling leaves this geometry unchanged and remains free.
    const geometry = [rect.x, rect.y, rect.width, rect.height, popupHeight, ...Object.values(values)].join('/');
    if (geometry !== this.geometry) { this.geometry = geometry; if (presented) this.options.resized(); }
  }
  private setPresented(state: PopupPresentation, reason?: SuspensionReason): void {
    if (state === this.presented && reason === this.reason) return;
    this.presented = state; this.reason = reason;
    this.options.presented(state, reason);
  }
  private stop(preserveExitPaint = false): void {
    // Native display/overlay owns close paint. Suspension and a fresh opening
    // still hide immediately; no placement or iPhone origin formula changes.
    if (!preserveExitPaint) this.popup?.style.setProperty('--_en-combobox-visibility', 'hidden');
    this.setPresented('pending');
    this.presented = undefined; this.reason = undefined;
    this.measurement?.stop();this.measurement=undefined;
    this.view=undefined;this.anchor=null;this.popup=null;
    this.geometry = '';
    this.originX = undefined; this.originY = undefined;
  }
}
