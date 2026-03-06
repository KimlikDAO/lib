/**
 * @typedef {{
 *   service: string,
 *   name: string,
 *   value?: string
 * }}
 */
const BunSecretsOptions = {};

/**
 * @interface
 */
class BunSecrets {
  /**
   * @param {BunSecretsOptions} options
   * @return {Promise<string | null>}
   */
  get(options) {}
  /**
   * @param {BunSecretsOptions} options
   * @return {Promise<void>}
   */
  set(options) {}
  /**
   * @param {BunSecretsOptions} options
   * @return {Promise<boolean>}
   */
  delete(options) {}
}

/** @const {BunSecrets} */
const secrets = /** @type {BunSecrets} */({});
