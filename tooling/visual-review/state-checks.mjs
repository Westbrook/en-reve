import {expect} from '@playwright/test';

/** Assert observable state through the same public browser surface as the actions. */
export async function verifyState(frame, checks = []) {
 for (const check of checks) {
  const target = frame.locator(check.selector);
  const assertion = expect(target, check.description ?? `Capture state: ${check.kind} ${check.selector}`);
  switch (check.kind) {
   case 'visible': await assertion.toBeVisible(); break;
   case 'hidden': await assertion.toBeHidden(); break;
   case 'focused': await assertion.toBeFocused(); break;
   case 'checked': await assertion.toBeChecked(); break;
   case 'text': await assertion.toContainText(check.value); break;
   case 'value': await assertion.toHaveValue(check.value); break;
   case 'attribute': await assertion.toHaveAttribute(check.name, check.value); break;
   case 'count': await assertion.toHaveCount(check.value); break;
   default: throw new Error('Unsupported state check: ' + check.kind);
  }
 }
 return checks.map(check => ({...check, status: 'passed'}));
}

