import { html } from 'lit';

export interface TableView {
	label: string;
	overflowing: boolean;
	onSlotChange: () => void;
	onFocusIn: (event: FocusEvent) => void;
}

export const tableTemplate = (view: TableView) => html`
	<div class="en-table" part="base">
		<div class="en-table__viewport" part="viewport" role="region"
			@focusin=${view.onFocusIn}
			aria-label=${view.label} tabindex=${view.overflowing ? '0' : '-1'}>
			<slot @slotchange=${view.onSlotChange}></slot>
		</div>
	</div>
`;
