import { assert } from "../../testing/assert";
import { base64 } from "../../util/çevir";
import { generate, prepareGenerateKey, verify } from "../verifiableID";

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
  console.log("private key:", base64(new Uint8Array(privateKey)));
  console.log("public key:", base64(new Uint8Array(publicKey)));
});

/**
 * @return {!Promise<boolean>}
 */
const testGenerateVerify1 = () => {
  /** @const {string} */
  const gizliAnahtar = "MIIBVQIBADANBgkqhkiG9w0BAQEFAASCAT8wggE7AgEAAkEA5gWLDHtfFthoCtHxRTFPCi"
    + "9yS13kySZnlHhfwhFdhJwF5pZFpZR9q1IUK6V2a6Tnpz4weiKQh8XWaaZjcFBgQQIDAQABAkA+cyjSRbiGWlC9B"
    + "0zK7V05NbKBNcfEuPGMRLYy2UYbl0DIg+5ckpl70Im1+Kx2/7MxJptlOEfxTYvg3y+CHxWxAiEA+sa8U8BNzgiB"
    + "kXtB5pMH0NJX2f23/IXTzdNnfLhakP0CIQDq0CIhMe8qPenTRGAEKS6pNsviquwFk1ceaDCYK/0BlQIgPkmagVr"
    + "keGZYeGAbEEA40r9MHtMMHebHovn9XFcV96kCIQDMeRPPTjlS0nlENJ1b4jS0u3fN2UMQE97gJqByUpPOBQIhAP"
    + "cZBivgFGdqevrSCts7hVE24fIzdE1eb9IrEUzRyhlK";
  /** @const {string} */
  const publicKey = "MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAOYFiwx7XxbYaArR8UUxTwovcktd5MkmZ5R4X8IRX"
    + "YScBeaWRaWUfatSFCuldmuk56c+MHoikIfF1mmmY3BQYEECAwEAAQ==";

  return prepareGenerateKey(gizliAnahtar)
    .then((/** @type {!webCrypto.CryptoKey} */ generateKey) =>
      generate("TR22345678902", generateKey))
    .then((/** @type {!did.VerifiableID} */ verifiableID) =>
      verify(verifiableID, "TR22345678902", publicKey))
    .then(assert);
}

/**
 * @return {!Promise<boolean>}
 */
const testGenerateVerify2 = () => {
  /** @const {string} */
  const gizliAnahtar = "MIIBVQIBADANBgkqhkiG9w0BAQEFAASCAT8wggE7AgEAAkEAxxht6rOMPXdVuvhBvPLuPC"
    + "Hi54QYTOzU8yfv6tsZ72x1SxK1kd7ytY8s7L2LkfPFYxCaHPyVDqhgYI96X3cx5wIDAQABAkEAnBQhrznceh9AX"
    + "Rfb6TWE4C0shZS/vCZ59rlbUwE6vr8k56XEOWgTAwzKzK25n32Cx0fMuws/RECu2bJrKRHdgQIhAOHk4UB9YQy2"
    + "k4g+0u2mAr6ZtMRpi4KK+fVNAA3kkDonAiEA4aE5y05cOQX8GPM221feI/TuIkq9H3PAa6cLRruu4kECIQDKhzD"
    + "FZyQKB++CKgFm/H5dcOW3a4GfSwcMPTsdOZ1t5QIgRq/wH1WpZuQNGvP3l7hri/BMOsoXficRfaiTy9E49QECIF"
    + "C3kb5YwcTEHLLyOjSQdhyY6LODIxiHJ3llvxfETHrR";
  /** @const {string} */
  const publicKey = "MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAMcYbeqzjD13Vbr4Qbzy7jwh4ueEGEzs1PMn7+rbG"
    + "e9sdUsStZHe8rWPLOy9i5HzxWMQmhz8lQ6oYGCPel93MecCAwEAAQ==";

  return prepareGenerateKey(gizliAnahtar)
    .then((/** @type {!webCrypto.CryptoKey} */ generateKey) =>
      generate("PERSONID", generateKey))
    .then((/** @type {!did.VerifiableID} */ verifiableID) =>
      verify(verifiableID, "PERSONID", publicKey))
    .then(assert);
}

generateKeyPair();
testGenerateVerify1();
testGenerateVerify2();
