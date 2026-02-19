interface Transaction {
  readonly to: string;
  readonly from: string;
  readonly value: string;
  readonly data: string;
  readonly chainId: string;
  readonly gas: string | number;
}

type TransactionHash = string;

export { Transaction, TransactionHash };
