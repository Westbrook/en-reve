/** Pagination uses safe one-based integer pages; zero totals explicitly mean unknown. */
export function normalizePage(value: unknown): number {
	const number = Number(value);
	return Number.isFinite(number) ? Math.max(1, Math.min(Number.MAX_SAFE_INTEGER, Math.floor(number))) : 1;
}
export function normalizePageCount(value: unknown): number {
	if (value === null || value === undefined || value === '') return 1;
	const number = Number(value);
	return Number.isFinite(number) && number >= 0 ? Math.min(Number.MAX_SAFE_INTEGER, Math.floor(number)) : 1;
}
export function currentPage(page: number, count: number): number {
	return count === 0 ? normalizePage(page) : Math.min(normalizePage(page), count);
}
export type PaginationItem = { kind: 'page'; page: number; key: string } | { kind: 'gap'; key: string };
/** Seven positions keep the navigation geometry stable as the window advances. */
export function paginationItems(page: number, count: number): PaginationItem[] {
	if (!count) return [];
	const number = (value: number): PaginationItem => ({ kind: 'page', page: value, key: `page-${value}` });
	const gap = (key: string): PaginationItem => ({ kind: 'gap', key });
	if (count <= 7) return Array.from({ length: count }, (_, index) => number(index + 1));
	if (page <= 4) return [1, 2, 3, 4, 5].map(number).concat(gap('end-gap'), number(count));
	if (page >= count - 3) return [number(1), gap('start-gap'), ...Array.from({ length: 5 }, (_, index) => number(count - 4 + index))];
	return [number(1), gap('start-gap'), number(page - 1), number(page), number(page + 1), gap('end-gap'), number(count)];
}
export function paginationText(template: string, page: number, count: number): string {
	return String(template ?? '').replaceAll('{page}', String(page)).replaceAll('{pages}', String(count));
}
