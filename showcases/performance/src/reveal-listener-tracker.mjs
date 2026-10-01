// SOURCE-ONLY RETENTION PROBE. Never install in timing or production pages.
// The function is deliberately self-contained for page.evaluate(function).
export function installRevealListenerTracker() {
  const globalName = '__revealRetentionListeners';
  if (globalName in window) throw new Error('Retention listener tracker already exists');
  const prototype = EventTarget.prototype;
  const addDescriptor = Object.getOwnPropertyDescriptor(prototype, 'addEventListener');
  const removeDescriptor = Object.getOwnPropertyDescriptor(prototype, 'removeEventListener');
  if (typeof addDescriptor?.value !== 'function' || typeof removeDescriptor?.value !== 'function') {
    throw new Error('Retention listener tracker requires data-method EventTarget descriptors');
  }
  const originalAdd = addDescriptor.value;
  const originalRemove = removeDescriptor.value;
  const types = ['wheel', 'touchstart', 'pointerdown', 'keydown'];
  const callbackIds = new WeakMap();
  const observers = new WeakSet();
  const active = new Map();
  const events = [];
  const errors = [];
  const limit = 8192;
  let nextId = 0, sequence = 0, dropped = 0, restored = false;
  let maxCounts = Object.fromEntries(types.map(type => [type, 0]));

  const isCallback = value => value !== null && (typeof value === 'object' || typeof value === 'function');
  const counts = () => Object.fromEntries(types.map(type => [type, [...active.values()].filter(entry => entry.type === type).length]));
  const record = (collection, entry) => {
    const value = {sequence: ++sequence, ...entry};
    if (events.length + errors.length < limit) collection.push(value);
    else dropped++;
  };
  const fail = (type, reason, id) => record(errors, {type, reason, ...(id === undefined ? {} : {id})});

  // Read data descriptors only. Native dispatch performs its normal option
  // accesses once; this probe must not invoke an option getter a second time.
  // Proxy descriptor/prototype traps cannot be made transparent here, so a trap
  // that throws invalidates diagnostics without replacing the native outcome.
  const dataOption = (options, name) => {
    try {
      let object = options;
      const seen = new Set();
      while (object !== null) {
        if (seen.has(object) || seen.size >= 32) return {error: 'option-prototype-chain-uninspectable'};
        seen.add(object);
        const descriptor = Object.getOwnPropertyDescriptor(object, name);
        if (descriptor) return Object.prototype.hasOwnProperty.call(descriptor, 'value')
          ? {value: descriptor.value} : {error: `accessor-option-${name}`};
        object = Object.getPrototypeOf(object);
      }
      return {value: undefined};
    } catch { return {error: `option-inspection-failed-${name}`}; }
  };
  const flatten = (options, adding) => {
    if (options === undefined || options === null) return {capture: false};
    if (typeof options === 'boolean') return {capture: options};
    if (typeof options !== 'object' && typeof options !== 'function') return {error: 'unsupported-primitive-options'};
    const capture = dataOption(options, 'capture');
    if (capture.error) return capture;
    if (!capture.value) return {capture: false};
    if (!adding) return {capture: true};
    const once = dataOption(options, 'once');
    if (once.error) return once;
    const passive = dataOption(options, 'passive');
    if (passive.error) return passive;
    const signal = dataOption(options, 'signal');
    if (signal.error) return signal;
    return {capture: true, automaticRemoval: Boolean(once.value) || signal.value != null};
  };

  const observe = (adding, receiver, args, options) => {
    const [type, callback] = args;
    if (receiver !== document || !isCallback(callback) || observers.has(callback)) return;
    // Do not coerce an event type twice: user coercion can have side effects.
    // Reject the diagnostic observation instead of silently undercounting it.
    if (typeof type !== 'string') { fail('unknown', 'non-string-document-event-type'); return; }
    if (!types.includes(type)) return;
    if (options.error) { fail(type, options.error); return; }
    if (!options.capture) return;
    let id = callbackIds.get(callback);
    if (id === undefined) {
      if (!adding) return; // It can belong to the pre-install CDP baseline.
      id = ++nextId;
      callbackIds.set(callback, id);
    }
    const key = `${type}\u0000${id}`;
    if (adding) {
      if (active.has(key)) { record(events, {operation: 'duplicate-add', type, id}); return; }
      if (options.automaticRemoval) {
        fail(type, 'new-capture-listener-with-once-or-signal', id);
        return;
      }
      active.set(key, {type, id});
      record(events, {operation: 'add', type, id});
      const current = counts();
      for (const name of types) maxCounts[name] = Math.max(maxCounts[name], current[name]);
    } else if (active.delete(key)) record(events, {operation: 'remove', type, id});
  };
  const inspect = (adding, receiver, args) => {
    const [type, callback, options] = args;
    if (receiver !== document || typeof type !== 'string' || !types.includes(type) || !isCallback(callback) || observers.has(callback)) return {capture: false};
    return flatten(options, adding);
  };

  function trackedAdd(...args) {
    const options = inspect(true, this, args);
    const result = Reflect.apply(originalAdd, this, args);
    observe(true, this, args, options);
    return result;
  }
  function trackedRemove(...args) {
    const options = inspect(false, this, args);
    const result = Reflect.apply(originalRemove, this, args);
    observe(false, this, args, options);
    return result;
  }
  Object.defineProperty(prototype, 'addEventListener', {...addDescriptor, value: trackedAdd});
  try { Object.defineProperty(prototype, 'removeEventListener', {...removeDescriptor, value: trackedRemove}); }
  catch (error) { Object.defineProperty(prototype, 'addEventListener', addDescriptor); throw error; }

  const tracker = {
    snapshot() {
      return {
        counts: counts(),
        active: [...active.values()].map(entry => ({...entry})).sort((a, b) => a.type.localeCompare(b.type) || a.id - b.id),
        maxCounts: {...maxCounts}, events: events.map(entry => ({...entry})), errors: errors.map(entry => ({...entry})), dropped,
      };
    },
    markObserver(callback) {
      if (!isCallback(callback)) throw new TypeError('Observer callback must be an object or function');
      observers.add(callback);
      const id = callbackIds.get(callback);
      if (id !== undefined) {
        for (const type of types) {
          if (active.delete(`${type}\u0000${id}`)) {
            fail(type, 'observer-marked-after-tracked-registration', id);
          }
        }
      }
    },
    resetCycle() {
      // IDs and weak observer markings span cycles; logs and maxima do not.
      // Never erase an outstanding active listener at a cycle boundary.
      events.length = 0; errors.length = 0; dropped = 0; sequence = 0;
      maxCounts = counts();
      if (active.size) fail('cycle', 'reset-with-active-capture-listeners');
    },
    restore() {
      if (restored) return;
      const currentAdd = Object.getOwnPropertyDescriptor(prototype, 'addEventListener');
      const currentRemove = Object.getOwnPropertyDescriptor(prototype, 'removeEventListener');
      if (currentAdd?.value !== trackedAdd || currentRemove?.value !== trackedRemove) {
        fail('restore', 'EventTarget-methods-changed-while-tracking');
        throw new Error('Cannot restore EventTarget methods after another owner replaced them');
      }
      Object.defineProperty(prototype, 'addEventListener', addDescriptor);
      Object.defineProperty(prototype, 'removeEventListener', removeDescriptor);
      restored = true;
      delete window[globalName];
    },
  };
  try { Object.defineProperty(window, globalName, {value: tracker, writable: true, configurable: true}); }
  catch (error) {
    Object.defineProperty(prototype, 'addEventListener', addDescriptor);
    Object.defineProperty(prototype, 'removeEventListener', removeDescriptor);
    throw error;
  }
  return tracker.snapshot();
}
