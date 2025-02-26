import base64 from "../../util/base64";

/**
 * @return {!Promise<void>}
 */
const generateKeyPair = () => crypto.subtle.generateKey({
  name: "RSASSA-PKCS1-v1_5",
  modulusLength: 512,
  publicExponent: new Uint8Array([1, 0, 1]),
  hash: "SHA-256",
}, true, ["sign", "verify"]).then((res) => Promise.all([
  crypto.subtle.exportKey("pkcs8", /** @type {!webCrypto.CryptoKeyPair} */(res).privateKey),
  crypto.subtle.exportKey("spki", /** @type {!webCrypto.CryptoKeyPair} */(res).publicKey),
])).then((/** @type {!Array<!ArrayBuffer>} */[privateKey, publicKey]) => {
  console.log("private key:", base64.from(new Uint8Array(privateKey)));
  console.log("public key:", base64.from(new Uint8Array(publicKey)));
});

generateKeyPair();
