/**
 * @constructor
 * @struct
 */
function InternalField() { }

/**
 * @param {bigint} bi
 * @return {!InternalField}
 */
const Field = (bi) => { }

/**
 * @constructor
 * @struct
 */
function Scalar() { }

/**
 * @param {bigint} bi
 * @return {!Scalar}
 */
Scalar.from = (bi) => { }

/**
 * @constructor
 * @struct
 */
function Signature() { }

/**
 * @param {{
 *   r: !InternalField,
 *   s: !Scalar
 * }} sig
 * @return {!Signature}
 */
Signature.fromObject = function (sig) { }

/**
 * @return {string}
 */
Signature.prototype.toBase58 = function () { }
