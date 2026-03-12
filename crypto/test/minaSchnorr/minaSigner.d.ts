interface SignedFields {
  readonly signature: string,
  readonly publicKey: string,
  readonly data: bigint[]
}

export { SignedFields };
