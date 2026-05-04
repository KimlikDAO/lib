import base64 from "../../util/base64";

const KEY_ALGORITHM = {
  name: "RSASSA-PKCS1-v1_5",
  modulusLength: 512,
  publicExponent: new Uint8Array([1, 0, 1]),
  hash: "SHA-256",
} satisfies RsaHashedKeyGenParams;

const generateKeyPair = async (): Promise<void> => {
  const { privateKey, publicKey } = await crypto.subtle.generateKey(
    KEY_ALGORITHM, true, ["sign", "verify"]
  );
  const [privateKeyBytes, publicKeyBytes] = await Promise.all([
    crypto.subtle.exportKey("pkcs8", privateKey),
    crypto.subtle.exportKey("spki", publicKey),
  ]);

  console.log("private key:", base64.from(new Uint8Array(privateKeyBytes)));
  console.log("public key:", base64.from(new Uint8Array(publicKeyBytes)));
};

await generateKeyPair();
