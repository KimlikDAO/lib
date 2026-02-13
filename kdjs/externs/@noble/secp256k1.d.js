/**
 * @author KimlikDAO
 */

/**
 * @constructor
 * @struct
 */
function ProjectivePoint() { }

/** @const {ProjectivePoint} */
ProjectivePoint.BASE;

/**
 * @return {ProjectivePoint}
 */
ProjectivePoint.prototype.double = function () { }

/**
 * @param {ProjectivePoint} other
 * @return {ProjectivePoint}
 */
ProjectivePoint.prototype.add = function (other) { }

/**
 * @return {{
 *   x: bigint,
 *   y: bigint
 * }}
 */
ProjectivePoint.prototype.toAffine = function () { }

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
