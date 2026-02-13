/**
 * @fileoverview Data structures to be used with `eth_decrypt`.
 *
 * @author KimlikDAO
 */

/**
 * An encrypted data blob. Can be decrypted with an `eth_decrypt` provider
 * call.
 */
interface EncryptedData {
  readonly version: string;
  readonly nonce: string;
  readonly ephemPublicKey: string;
  readonly ciphertext: string;
}

export { EncryptedData };
