export function reportBase(value = '/') {
  if (!/^\/(?:[a-zA-Z0-9_-]+\/)*$/.test(value)) {
    throw new Error('Performance report base must be an absolute, trailing-slash path.');
  }
  return value;
}
