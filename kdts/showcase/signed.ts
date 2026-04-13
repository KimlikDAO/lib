type PublicKey = string;

type Signed<T> = {
  signature: string;
  pubKey: PublicKey;
  timestamp: number
  data: T;
};

const signedFields: Signed<bigint[]> = {
  signature: "xyz",
  pubKey: "b62",
  timestamp: 123989293,
  data: [1n, 2n]
};

console.log(signedFields);
