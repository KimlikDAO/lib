import { expect, it, describe } from "bun:test";
import { ChainGroup } from "../chains";
import { MockSigner } from "../mock/signer";
import { decrypt, encrypt } from "../unlockable";
import { EthersSigner } from "../../ethereum/mock/ethersSigner";

it("should encrypt / decrypt small text on ChainGroup.EVM", () => {
  /** @const {bigint} */
  const privKey = 0x1337ACCn;
  /** @const {!MockSigner} */
  const signer = new MockSigner(privKey);
  /** @const {string} */
  const text = "Text to encrypt";
  expect(
    encrypt(
      text,
      "Sign to encrypt this text",
      "promptsign-sha256-aes-ctr",
      signer,
      signer.getAddress(ChainGroup.EVM)
    ).then((unlockable) =>
      decrypt(unlockable, signer, signer.getAddress(ChainGroup.EVM))))
    .resolves.toBe(text);
});

it("should encrypt / decrypt large text on ChainGroup.EVM", () => {
  /** @const {bigint} */
  const privKey = 0x1337ADD3n;
  /** @const {!MockSigner} */
  const signer = new MockSigner(privKey);
  /** @const {string} */
  const text = "Text to encrypt".repeat(1000);
  expect(
    encrypt(
      text,
      "Sign to encrypt this long ah text",
      "promptsign-sha256-aes-ctr",
      signer,
      signer.getAddress(ChainGroup.EVM)
    ).then((unlockable) =>
      decrypt(unlockable, signer, signer.getAddress(ChainGroup.EVM))))
    .resolves.toBe(text);
});

describe("Golden tests", () => {
  /** @const {!EthersSigner} */
  const signer = new EthersSigner(1337n);

  it("should decrypt golden text 1", () => {
    /** @const {!crosschain.Unlockable} */
    const unlockable = /** @type {!crosschain.Unlockable} */ ({
      version: "promptsign-sha256-aes-ctr",
      nonce: "0+65lpD4UK01Ljy90sdYCA==",
      ciphertext: "y4GV2MBVZml0uT69UIdOKv0DEolaTgTaSOyhtz5DvWcIGB/KrjFNCxuaA" +
        "aZdB15QprV2CFG06fPnfDuQ98YLcOKGbdOpYQMjPf/1ZcAwM2MJa2VeDb0vQyuR25oR" +
        "8er68809+uEtRP/PITEEJ2/JIRLyfaTwmlUezvqHDCkCwvkDU8kWWOxwuFCFFiNOOf3" +
        "BdZglezlrxFiKQxI/cH8e0jEAFqyiKZtH0vMbgU4bF6OOv/0mXudIi9zNxxgPwYU6Ho" +
        "Fm0C8ck1KMfEzhAaDUJCCI+jEhb4c2SbDoN8VS+lKO5C2AdotIC6tEDZYyricXxwafK" +
        "7jA6GqFII2YjRX+SQ==",
      userPrompt: "Golden prompt"
    });
    expect(decrypt(unlockable, signer, signer.getAddress()))
      .resolves.toBe("Golden text");
  });
});
