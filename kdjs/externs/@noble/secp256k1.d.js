/**
 * @author KimlikDAO
 */

/** @interface */
class NoblePoint {
  /** @return {NoblePoint} */
  double() { }
  /**
   * @param {NoblePoint} other
   * @return {NoblePoint}
   */
  add(other) { }
  /** @return {{ x: bigint, y: bigint }} */
  toAffine() { }
}

/** @const {NoblePoint} */
NoblePoint.BASE;

/**
 * @param {Uint8Array} digest
 * @param {Uint8Array} privKey
 * @param {{
 *   prehash?: boolean,
 *   lowS?: boolean,
 *   extraEntropy?: Uint8Array | boolean,
 *   format?: string
 * }} options
 * @return {Promise<Uint8Array>}
 */
const signAsync = function (digest, privKey, options) { }
