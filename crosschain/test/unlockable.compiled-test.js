import { assertEq } from "../../testing/assert";
import { FakeSigner } from "../../testing/crosschain";
import { decrypt, encrypt } from "../unlockable";

/**
 * @return {!Promise<boolean>}
 */
const testEncryptDecryptSmall = () => {
  /** @const {!bigint} */
  const privKey = 0x1337ACCn;
  /** @const {!FakeSigner} */
  const signer = new FakeSigner(privKey);
  /** @const {string} */
  const text = "Text to encrypt";
  return encrypt(
    text,
    "Sign to encrypt this text",
    "promptsign-sha256-aes-ctr",
    signer,
    signer.getAddress()
  )
    .then((unlockable) =>
      decrypt(unlockable, signer, signer.getAddress()))
    .then((/** @type {string} */ decrypted) => assertEq(decrypted, text));
}

/**
 * @return {!Promise<boolean>}
 */
const testEncryptDecryptLarge = () => {
  /** @const {!bigint} */
  const privKey = 0x1337ADD3n;
  /** @const {!FakeSigner} */
  const signer = new FakeSigner(privKey);
  /** @const {string} */
  const text = "Text to encrypt".repeat(1000);
  return encrypt(
    text,
    "Sign to encrypt this long ah text",
    "promptsign-sha256-aes-ctr",
    signer,
    signer.getAddress()
  )
    .then((unlockable) =>
      decrypt(unlockable, signer, signer.getAddress()))
    .then((/** @type {string} */ decrypted) => assertEq(decrypted, text));
}

testEncryptDecryptSmall();
testEncryptDecryptLarge();
