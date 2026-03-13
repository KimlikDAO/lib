/**
 * @fileoverview Functions for working with `Unlockable`'s.
 *
 * @author KimlikDAO
 */
import base64 from "../util/base64";
import { wait } from "../util/promises";
import { Address } from "./address";
import { Signer } from "./signer";
import { Unlockable } from "./unlockable.d";

const decrypt = async (
  unlockable: Unlockable,
  signer: Signer,
  address: Address
): Promise<string> => {
  if (unlockable.version !== "promptsign-sha256-aes-ctr")
    return Promise.reject();
  const secret = await signer.deriveSecret(unlockable.userPrompt, address);
  const key = await crypto.subtle.importKey("raw", secret, "AES-CTR", false, ["decrypt"]);
  const decrypted = await crypto.subtle.decrypt({
    name: "AES-CTR",
    counter: base64.toBytes(unlockable.nonce),
    length: 64
  }, key, base64.toBytes(unlockable.ciphertext));
  const decoded = new TextDecoder().decode(decrypted);
  return decoded.slice(0, decoded.indexOf("\0"));
}

const encrypt = async (
  text: string,
  userPrompt: string,
  version: string,
  signer: Signer,
  address: Address
): Promise<Unlockable> => {
  if (version !== "promptsign-sha256-aes-ctr")
    return Promise.reject();
  const encoder = new TextEncoder();
  const encoded = encoder.encode(text);
  const padded = new Uint8Array(encoded.length + 256 - (encoded.length & 255));
  padded.set(encoded);
  const counter = crypto.getRandomValues(new Uint8Array(16)) as Uint8Array<ArrayBuffer>;

  const encryptWithSecret = async (secret: ArrayBuffer): Promise<Unlockable> => {
    const key = await crypto.subtle.importKey("raw", secret, "AES-CTR", false, ["encrypt"]);
    const encrypted = await crypto.subtle.encrypt({
      name: "AES-CTR",
      counter,
      length: 64,
    }, key, padded);
    return {
      version: "promptsign-sha256-aes-ctr",
      nonce: base64.from(counter),
      ciphertext: base64.from(new Uint8Array(encrypted)),
      userPrompt,
    } as Unlockable;
  };

  try {
    const secret = await signer.deriveSecret(userPrompt, address);
    return encryptWithSecret(secret);
  } catch {
    await wait(200);
    const secret = await signer.deriveSecret(userPrompt, address);
    return encryptWithSecret(secret);
  }
}

export { decrypt, encrypt };
