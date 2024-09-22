/**
 * @fileoverview Functions for working with `Unlockable`'s.
 *
 * @author KimlikDAO
 */

import { base64, base64ten } from "../util/çevir";
import { Signer } from "./signer";
import "./unlockable.d";

/**
 * @param {!crosschain.Unlockable} unlockable
 * @param {!Signer} signer
 * @param {string} address
 * @return {!Promise<string>}
 */
const decrypt = (unlockable, signer, address) => {
  switch (unlockable.version) {
    case "promptsign-sha256-aes-ctr": {
      return signer.deriveSecret(unlockable.userPrompt, address)
        .then((/** @type {!ArrayBuffer} */ secret) =>
          crypto.subtle.importKey("raw", secret, "AES-CTR", false, ["decrypt"]))
        .then((/** @type {!webCrypto.CryptoKey}*/ key) =>
          crypto.subtle.decrypt({
            name: "AES-CTR",
            counter: base64ten(unlockable.nonce),
            length: 64
          },
            key,
            base64ten(unlockable.ciphertext)
          ))
        .then((/** @type {!ArrayBuffer} */ decrypted) => {
          const decoded = new TextDecoder().decode(decrypted);
          return decoded.slice(0, decoded.indexOf("\0"));
        });
    }
  }
  return Promise.reject();
}

/**
 * @param {string} text
 * @param {string} userPrompt
 * @param {string} version
 * @param {!Signer} signer
 * @param {string} address
 * @return {!Promise<!crosschain.Unlockable>}
 */
const encrypt = (text, userPrompt, version, signer, address) => {
  switch (version) {
    case "promptsign-sha256-aes-ctr": {
      /** @const {!TextEncoder} */
      const encoder = new TextEncoder();
      /** @const {!Uint8Array} */
      const encoded = encoder.encode(text);
      /** @const {!Uint8Array} */
      const padded = new Uint8Array(encoded.length + 256 - (encoded.length & 255));
      padded.set(encoded);
      /** @const {!Uint8Array} */
      const counter = /** @type {!Uint8Array} */(crypto.getRandomValues(new Uint8Array(16)));

      /**
       * @param {!ArrayBuffer} secret
       * @return {!Promise<!crosschain.Unlockable>}
       */
      const encryptWithSecret = (secret) =>
        crypto.subtle.importKey("raw", secret, "AES-CTR", false, ["encrypt"])
          .then((/** @type {!webCrypto.CryptoKey} */ key) =>
            crypto.subtle.encrypt({
              name: "AES-CTR",
              counter,
              length: 64
            },
              key,
              padded
            ))
          .then((/** @type {!ArrayBuffer} */ encrypted) => /** @type {!crosschain.Unlockable} */({
            version: "promptsign-sha256-aes-ctr",
            nonce: base64(counter),
            ciphertext: base64(new Uint8Array(encrypted)),
            userPrompt
          }));
      /** @return {!Promise<!ArrayBuffer>} */
      const requestSecret = () => signer.deriveSecret(userPrompt, address);

      return requestSecret()
        .then(encryptWithSecret)
        .catch(() => requestSecret().then((signature) => new Promise(
          (/** @type {function(!Promise<!crosschain.Unlockable>):void} */ resolve) =>
            setTimeout(() => resolve(encryptWithSecret(signature)), 200)))
        );
    }
  }
  return Promise.reject();
}

export { decrypt, encrypt };
