/** Application service outcome. Each workflow owns its value and problem types. */
export type Result<Value, Problem> =
	| { readonly ok: true; readonly value: Value }
	| { readonly ok: false; readonly problem: Problem };

export function success<Value>(value: Value): Result<Value, never> {
	return { ok: true, value };
}

export function failure<Problem>(problem: Problem): Result<never, Problem> {
	return { ok: false, problem };
}
