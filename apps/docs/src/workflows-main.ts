import { legacyWorkflowTarget } from './workflow-pages/navigation.js';

// Old links redirect before importing or constructing the sign-in application.
const target = legacyWorkflowTarget(new URL(location.href));
if (target) location.replace(target.href);
else await import('./workflow-pages/sso-entry.js');
