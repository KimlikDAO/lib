import { expect, it } from "bun:test";
import { ChainGroup } from "../chains";
import { MockSigner } from "../mock/signer";
import { decrypt, encrypt } from "../unlockable";

it("should encrypt / decrypt small text on ChainGroup.EVM", () => {
  /** @const {bigint} */
  const privKey = 0x1337ACCn;
  /** @const {!MockSigner} */
  const signer = new MockSigner(privKey);
  /** @const {string} */
  const text = "Text to encrypt";
  return encrypt(
    text,
    "Sign to encrypt this text",
    "promptsign-sha256-aes-ctr",
    signer,
    signer.getAddress(ChainGroup.EVM)
  )
    .then((unlockable) =>
      decrypt(unlockable, signer, signer.getAddress(ChainGroup.EVM)))
    .then((/** @type {string} */ decrypted) => expect(decrypted).toBe(text));
});

it("should encrypt / decrypt large text on ChainGroup.EVM", () => {
  /** @const {bigint} */
  const privKey = 0x1337ADD3n;
  /** @const {!MockSigner} */
  const signer = new MockSigner(privKey);
  /** @const {string} */
  const text = "Text to encrypt".repeat(1000);
  return encrypt(
    text,
    "Sign to encrypt this long ah text",
    "promptsign-sha256-aes-ctr",
    signer,
    signer.getAddress(ChainGroup.EVM)
  )
    .then((unlockable) =>
      decrypt(unlockable, signer, signer.getAddress(ChainGroup.EVM)))
    .then((/** @type {string} */ decrypted) => expect(decrypted).toBe(text));
});
