import { EnTextField } from '@en-reve/elements/text-field.js';

// One fixture definition shared by Node SSR and browser hydration. Imports have
// no registry side effect. The inherited editing/form adapters remain untouched.
export class ProbeOwnedField extends EnTextField {
  static shadowRootOptions = { ...EnTextField.shadowRootOptions, referenceTarget: 'control' };
  createRenderRoot() {
    const root = super.createRenderRoot();
    if (this.hasAttribute('force-label-bridge') && 'referenceTarget' in root) root.referenceTarget = null;
    return root;
  }
}
