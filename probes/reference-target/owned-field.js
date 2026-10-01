import { EnTextField } from '@en-reve/elements/text-field.js';
import { OwnedLabels } from './owned-labels.js';

// One fixture definition shared by Node SSR and browser hydration. Imports have
// no registry side effect. The inherited editing/form adapters remain untouched.
export class ProbeOwnedField extends EnTextField {
  static shadowRootOptions = { ...EnTextField.shadowRootOptions, referenceTarget: 'control' };
  constructor() {
    super();
    this.ownedLabels = new OwnedLabels(this, () => this.controlNode);
  }
  createRenderRoot() {
    const root = super.createRenderRoot();
    if (this.hasAttribute('force-label-bridge') && 'referenceTarget' in root) root.referenceTarget = null;
    return root;
  }
}
