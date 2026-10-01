/** npm 12 keys pack receipts by package name; earlier npm returned an array. */
export function parsePackOutput(text) {
  const value = JSON.parse(text);
  const entries = Array.isArray(value) ? value : value && typeof value === 'object' ? Object.values(value) : [];
  if (!entries.length || entries.some(entry => !entry || typeof entry.name !== 'string' ||
    typeof entry.filename !== 'string' || !/^[^/\\]+\.tgz$/.test(entry.filename) || typeof entry.integrity !== 'string')) {
    throw new Error('Invalid npm pack receipt');
  }
  return entries;
}

export function singlePackOutput(text, expectedName) {
  const entries = parsePackOutput(text);
  if (entries.length !== 1 || entries[0].name !== expectedName) {
    throw new Error(`Expected exactly one packed ${expectedName}`);
  }
  return entries[0];
}
