/** Node's native event stream preserves exact source/case/outcome attribution beside TAP. */
export default async function* nodeFacetReporter(events) {
  for await (const event of events) yield JSON.stringify(event, (_key, value) =>
    value instanceof Error ? { name:value.name, message:value.message, stack:value.stack, ...value } : value) + '\n';
}
