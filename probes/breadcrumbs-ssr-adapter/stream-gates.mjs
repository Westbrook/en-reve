/** Per-navigation ownership; one request can never release another request's staged body. */
export class StreamGates {
  #gates = new Map();
  create(id) {
    if (!/^[a-zA-Z0-9-]{1,128}$/.test(id ?? '') || this.#gates.has(id)) throw new Error('Missing, invalid or duplicate stream identity');
    let release;
    const promise = new Promise(resolve => { release = resolve; });
    this.#gates.set(id, release);
    return { promise, cancel: () => this.release(id) };
  }
  release(id) {
    const release = this.#gates.get(id);
    if (!release) return false;
    this.#gates.delete(id); release(); return true;
  }
}
