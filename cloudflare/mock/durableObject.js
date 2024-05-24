
/**
 * @implements {!cloudflare.DurableObjectState}
 */
class DurableObjectState {
  constructor() {
    /** @const {!cloudflare.DurableObjectId} */
    this.id = {};
    this.mem = {};
    /** @const {!cloudflare.DurableObjectStorage} */
    this.storage = {
      /**
       * @override
       *
       * @param {!Array<string>} keys
       */
      get: (keys) => {
        const map = new Map();
        const mem = this.mem;
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
        if (typeof keys === 'string')
          this.mem[keys] = val;
        else
          Object.assign(this.mem, keys);
        return Promise.resolve();
      },

      delete: (key) => Promise.resolve(true)
    }
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

export { DurableObjectState };
