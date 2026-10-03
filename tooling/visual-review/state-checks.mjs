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
   case 'css': await assertion.toHaveCSS(check.name, check.value); break;
   case 'css-relationship': {
    const reference = frame.locator(check.referenceSelector);
    await expect(target).toHaveCount(1); await expect(reference).toHaveCount(1);
    await expect.poll(async () => {
     const read = element => element.evaluate((node, name) => getComputedStyle(node).getPropertyValue(name).trim(), check.name);
     const [actual, expected] = await Promise.all([read(target), read(reference)]);
     if (!actual || !expected) throw new Error('CSS relationship requires two resolved values.');
     if (check.relation === 'equal') return actual === expected;
     if (check.relation === 'different') return actual !== expected;
     // Numeric ordering is meaningful only for resolved pixel lengths.
     if (![actual, expected].every(value => /^-?(?:\d+\.?\d*|\.\d+)px$/.test(value))) throw new Error('Ordered CSS relationship requires pixel lengths.');
     return check.relation === 'greater' ? parseFloat(actual) > parseFloat(expected) : parseFloat(actual) < parseFloat(expected);
    }, {message: check.description ?? `CSS ${check.name}: ${check.relation} ${check.referenceSelector}`}).toBe(true);
    break;
   }
   case 'count': await assertion.toHaveCount(check.value); break;
   default: throw new Error('Unsupported state check: ' + check.kind);
  }
 }
 return checks.map(check => ({...check, status: 'passed'}));
}

