import { describe, expect, it } from "bun:test";
import { EthersSigner } from "../../ethereum/mock/ethersSigner";
import { MockSigner } from "../mock/signer";
import { decrypt, encrypt } from "../unlockable";
import { Unlockable } from "../unlockable.d";

it("encrypt / decrypt small text on ChainGroup.EVM", () => {
  const privKey = 0x1337accn;
  const signer = new MockSigner(privKey);
  const text = "Text to encrypt";
  expect(
    encrypt(
      text,
      "Sign to encrypt this text",
      "promptsign-sha256-aes-ctr",
      signer,
      signer.getAddress(),
    ).then((unlockable) =>
      decrypt(unlockable, signer, signer.getAddress())))
    .resolves.toBe(text);
});

it("encrypt / decrypt large text on ChainGroup.EVM", () => {
  const privKey = 0x1337add3n;
  const signer = new MockSigner(privKey);
  const text = "Text to encrypt".repeat(1000);
  expect(
    encrypt(
      text,
      "Sign to encrypt this long ah text",
      "promptsign-sha256-aes-ctr",
      signer,
      signer.getAddress()
    ).then((unlockable) =>
      decrypt(unlockable, signer, signer.getAddress())))
    .resolves.toBe(text);
});

describe("Golden tests", () => {
  const signer = new EthersSigner(1337n);

  it("decrypt golden text 1", () => {
    const unlockable: Unlockable = {
      version: "promptsign-sha256-aes-ctr",
      nonce: "0+65lpD4UK01Ljy90sdYCA==",
      ciphertext: "y4GV2MBVZml0uT69UIdOKv0DEolaTgTaSOyhtz5DvWcIGB/KrjFNCxuaA" +
        "aZdB15QprV2CFG06fPnfDuQ98YLcOKGbdOpYQMjPf/1ZcAwM2MJa2VeDb0vQyuR25oR" +
        "8er68809+uEtRP/PITEEJ2/JIRLyfaTwmlUezvqHDCkCwvkDU8kWWOxwuFCFFiNOOf3" +
        "BdZglezlrxFiKQxI/cH8e0jEAFqyiKZtH0vMbgU4bF6OOv/0mXudIi9zNxxgPwYU6Ho" +
        "Fm0C8ck1KMfEzhAaDUJCCI+jEhb4c2SbDoN8VS+lKO5C2AdotIC6tEDZYyricXxwafK" +
        "7jA6GqFII2YjRX+SQ==",
      userPrompt: "Golden prompt"
    };
    expect(decrypt(unlockable, signer, signer.getAddress())).resolves
      .toBe("Golden text");
  });
});
