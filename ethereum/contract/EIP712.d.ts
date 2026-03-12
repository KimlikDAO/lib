type EIP712TypeProperty = {
  readonly name: string;
  readonly type: string;
}

type EIP712Type = "EIP712Domain" | "Permit" | "PermitBatch" | "Person" | "Mail";

type EIP712DomainData = {
  readonly name: string;
  readonly version: string;
  readonly chainId: string | number;
  readonly verifyingContract: string;
}

type EIP712TypeRegistry = Record<string, EIP712TypeProperty[]>;

interface EIP712TypedData {
  readonly types: EIP712TypeRegistry;
  readonly primaryType: EIP712Type;
  readonly domain: EIP712DomainData;
  readonly message: Record<string, unknown>;
}

export { 
  EIP712DomainData,
  EIP712Type,
  EIP712TypedData,
  EIP712TypeProperty,
  EIP712TypeRegistry,
};
