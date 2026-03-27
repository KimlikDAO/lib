type Signature = string;

interface SignerSignature {
  signer: string;
  signature: Signature
}

export {
  Signature,
  SignerSignature,
};
