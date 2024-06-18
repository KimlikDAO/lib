/**
 * @constructor
 * @implements {cloudflare.KeyValue}
 */
function MockKeyValue() { }

/**
 * @override
 *
 * @param {string} key
 * @param {string=} type
 * @return {!Promise<ArrayBuffer>}
 */
MockKeyValue.prototype.get = (key, type) =>
  Promise.resolve(new TextEncoder().encode(key).buffer);

/**
 * @override
 *
 * @param {string} key
 * @param {string|!ArrayBuffer} value
 * @return {!Promise<void>}
 */
MockKeyValue.prototype.put = (key, value) => Promise.resolve()
  .then(() => console.log(key, value));

/**
 * @override
 *
 * @param {string} key
 * @return {!Promise<void>}
 */
MockKeyValue.prototype.delete = (key) => Promise.resolve();

/**
 * @override
 *
 * @return {!Promise<!cloudflare.KeyValueList>}
 */
MockKeyValue.prototype.list = () => Promise.resolve(new cloudflare.KeyValueList());

export { MockKeyValue };
