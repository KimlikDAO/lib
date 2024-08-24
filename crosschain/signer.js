/**
 * @interface
 * @struct
 */
function Signer() { }

/**
 * @param {string} message
 * @param {string} address
 * @return {!Promise<!ArrayBuffer>} an array buffer of length 32, which is the secret
 */
Signer.prototype.deriveSecret = (message, address) => { }

export { Signer };
