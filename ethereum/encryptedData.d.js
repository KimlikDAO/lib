/**
 * @fileoverview Data structures to be used with `eth_decrypt`.
 *
 * @author KimlikDAO
 * @externs
 */

import eth from "./eth.d";

/**
 * An encrypted data blob. Can be unencrypted with an `eth_decrypt` provider
 * call.
 *
 * @interface
 * @struct
 */
eth.EncryptedData = function () { }

/** @type {string} */
eth.EncryptedData.prototype.version;

/** @type {string} */
eth.EncryptedData.prototype.nonce;

/** @type {string} */
eth.EncryptedData.prototype.ephemPublicKey;

/** @type {string} */
eth.EncryptedData.prototype.ciphertext;
