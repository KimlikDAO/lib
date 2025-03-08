/**
 * @author KimlikDAO
 */

/**
 * @constructor
 * @struct
 */
function ProjectivePoint() { }

/** @const {!ProjectivePoint} */
ProjectivePoint.BASE;

/**
 * @return {!ProjectivePoint}
 */
ProjectivePoint.prototype.double = function () { }

/**
 * @param {!ProjectivePoint} other
 * @return {!ProjectivePoint}
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
 * @param {!Uint8Array|string} digest
 * @param {bigint|string} privKey
 * @param {{
 *   lowS: (boolean|undefined),
 *   extraEntropy: (!Uint8Array|boolean|undefined)
 * }} options
 * @return {!Promise<{
 *   r: bigint,
 *   s: bigint,
 *   recovery: number
 * }>}
 */
const signAsync = function (digest, privKey, options) { }
