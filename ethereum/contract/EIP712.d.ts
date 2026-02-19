type EIP712TypeProperty = {
  readonly name: string;
  readonly type: string;
}

type EIP712Type = "EIP712Domain" | "Permit";

type EIP712Domain = {
  readonly name: string;
  readonly version: string;
  readonly chainId: string;
  readonly verifyingContract: string;
}

type EIP712Types = Record<EIP712Type, EIP712TypeProperty[]>;

interface EIP712TypedData {
  readonly types: EIP712Types;
  readonly primaryType: EIP712Type;
  readonly domain: EIP712Domain;
  readonly message: Record<string, unknown>;
}

export { 
  EIP712Domain,
  EIP712Type,
  EIP712TypedData,
  EIP712TypeProperty,
  EIP712Types,
}
