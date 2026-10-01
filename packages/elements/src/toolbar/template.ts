import { html, nothing } from 'lit';

export interface ToolbarView {
  label: string;
  orientation: 'horizontal' | 'vertical';
  nativeNavigation: boolean;
  onSlotChange: () => void;
}

export const toolbarTemplate = (view: ToolbarView) => html`
  <div class="en-toolbar" part="base" role=${view.nativeNavigation ? 'group' : 'toolbar'} aria-label=${view.label}
    data-orientation=${view.orientation === 'vertical' ? 'vertical' : 'horizontal'}
    aria-orientation=${view.nativeNavigation ? nothing : view.orientation === 'vertical' ? 'vertical' : 'horizontal'}>
    <slot @slotchange=${view.onSlotChange}></slot>
  </div>
`;
