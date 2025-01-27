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
