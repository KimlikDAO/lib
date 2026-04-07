type PublicKey = string;
type PrivateKey = string;

type SignatureJson = {
  field: string;
  scalar: string;
}

export type NetworkId =
  | "mainnet"
  | "devnet"
  | "testnet"
  | { custom: string };

type SignedMessage = {
  signature: SignatureJson;
  publicKey: PublicKey;
  data: string;
}

type SignedFields = {
  signature: string;
  publicKey: PublicKey;
  data: bigint[];
};

export class Client {
  constructor(params: { network: NetworkId });

  signMessage(message: string, privateKey: PrivateKey): SignedMessage;
  verifyMessage(signedMessage: SignedMessage): boolean;

  signFields(fields: bigint[], privateKey: PrivateKey): SignedFields;
  verifyFields(signedFields: SignedFields): boolean;

  derivePublicKey(privateKey: PrivateKey): PublicKey;
}

export default Client;
