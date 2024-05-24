
/**
 * @implements {cloudflare.DurableObjectState}
 */
class DurableObjectState {
  constructor() {
    /** @const {!cloudflare.DurableObjectId} */
    this.id = /** @type {!cloudflare.DurableObjectId} */({});
    this.mem = {};
    /** @const {!cloudflare.DurableObjectStorage} */
    this.storage = /** @type {!cloudflare.DurableObjectStorage} */({
      /**
       * @override
       *
       * @param {string|!Array<string>} keys
       * @return {!Promise<?>}
       */
      get: (keys) => {
        const mem = this.mem;
        if (typeof keys === "string")
          return Promise.resolve(mem[keys]);
        const map = new Map();
        for (const key of keys)
          if (key in mem) map.set(key, mem[key]);
        return Promise.resolve(map);
      },

      /**
       * @override
       *
       * @param {string|!Object<string, *>} keys
       * @param {*=} val
       * @return {!Promise<void>}
       */
      put: (keys, val) => {
        if (typeof keys === "string")
          this.mem[keys] = val;
        else
          Object.assign(this.mem, keys);
        return Promise.resolve();
      },

      /**
       * @override
       *
       * @param {string} key
       * @return {!Promise<boolean>}
       */
      delete: (key) => Promise.resolve(true)
    });
  }

  /**
   * @override
   *
   * @template T
   * @param {function():!Promise<T>} callback
   * @return {!Promise<T>}
   */
  blockConcurrencyWhile(callback) {
    return callback();
  }
}

/**
 * @implements {cloudflare.DurableObject}
 */
class DurableObject {
  /**
   * @param {!cloudflare.DurableObjectState} state
   * @param {!cloudflare.Environment} env
   */
  constructor(state, env) { }

  /**
   * @override
   *
   * @param {!Request} req
   * @return {!Promise<!Response>}
   */
  fetch(req) { return Promise.reject(); }
};

export { DurableObject, DurableObjectState };
