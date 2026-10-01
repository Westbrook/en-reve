/** Native Playwright stops its own workers and retains incomplete failed coverage.
 * Keep standalone commands and deliberate diagnostic collection at their owning policy.
 */
export function browserFailureCommand(command, {failFast = true} = {}) {
 return failFast ? [...command, '--max-failures=1'] : [...command];
}
