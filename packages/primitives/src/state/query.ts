export type QueryOperator = 'equals' | 'not-equals' | 'contains' | 'greater-than' | 'less-than';
export interface QueryClause {
    readonly id: string;
    readonly field: string;
    readonly operator: QueryOperator;
    readonly value: string;
}
export interface Query {
    readonly match: 'all' | 'any';
    readonly clauses: readonly QueryClause[];
}
export interface QueryField {
    readonly value: string;
    readonly label: string;
    readonly type?: 'text' | 'number';
}
export const queryOperators: readonly QueryOperator[] = ['equals', 'not-equals', 'contains', 'greater-than', 'less-than'];
export function copyQuery(value: Query): Query { return { match: value.match === 'any' ? 'any' : 'all', clauses: value.clauses.map(c => ({ ...c })) }; }
/** Validate the serialization contract; evaluating clauses is application-owned. */
export function validateQuery(query: Query, fields: readonly QueryField[]): string {
    if (new Set(query.clauses.map(c => c.id)).size !== query.clauses.length)
        return 'Clause identifiers must be unique.';
    for (const clause of query.clauses) {
        const field = fields.find(f => f.value === clause.field);
        if (!clause.id || !field)
            return 'Choose a field for every condition.';
        if (!queryOperators.includes(clause.operator))
            return 'Choose a supported operator.';
        if (!clause.value.trim())
            return 'Enter a value for every condition.';
        if (field.type === 'number' && !Number.isFinite(Number(clause.value)))
            return 'Enter a number.';
        if (field.type !== 'number' && ['greater-than', 'less-than'].includes(clause.operator))
            return 'This comparison requires a numeric field.';
    }
    return '';
}
