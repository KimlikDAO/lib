interface TypedDataDomain {
  name: string;
  version: string;
  chainId: number | string;
  verifyingContract: string;
}

interface ITypedDataEncoder {
  hashDomain(typedDataDomain: TypedDataDomain): string;
  hash(domain: TypedDataDomain, types: any, message: any): string;
}

export var ethers: {
  TypedDataEncoder: ITypedDataEncoder;
};

export class Wallet {
  readonly address: string;

  constructor(privateKey: string, provider?: unknown);
  signMessage(message: string): Promise<string>;
}
