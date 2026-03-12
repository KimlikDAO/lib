import {
  G,
  signFields as signFieldsUnpacked,
  signMessage as signMessageUnpacked,
  verifyFields as verifyFieldsUnpacked,
  verifyMessage as verifyMessageUnpacked
} from "../crypto/minaSchnorr";
import address from "./address";
import signature from "./signature";
import { SignerSignature } from "./signature.d";

/** @pure  */
const signFields = (
  fields: readonly bigint[],
  privKey: bigint
): SignerSignature => {
  const A = G.copy().multiply(privKey).proj();
  const sig = signFieldsUnpacked(fields, privKey, A);
  return {
    signer: address.fromPoint(A),
    signature: signature.fromUnpacked(sig)
  } as SignerSignature;
}

/** @pure  */
const signMessage = (message: string, privKey: bigint): SignerSignature => {
  const A = G.copy().multiply(privKey).proj();
  const sig = signMessageUnpacked(message, privKey, A);
  return {
    signer: address.fromPoint(A),
    signature: signature.fromUnpacked(sig)
  } as SignerSignature;
}

/** @pure  */
const verifyFields = (
  fields: readonly bigint[],
  sig: SignerSignature
): boolean => {
  const { r, s } = signature.toUnpacked(sig.signature);
  const pubKey = address.toPublicKey(sig.signer);
  return verifyFieldsUnpacked(fields, r, s, pubKey);
}

/** @pure  */
const verifyMessage = (message: string, sig: SignerSignature): boolean => {
  const { r, s } = signature.toUnpacked(sig.signature);
  const pubKey = address.toPublicKey(sig.signer);
  return verifyMessageUnpacked(message, r, s, pubKey);
}

export {
  signFields,
  signMessage,
  verifyFields,
  verifyMessage
};
