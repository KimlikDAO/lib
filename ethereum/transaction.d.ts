/**
 * Represents an ethereum transaction (outgoing or as returned by the node).
 * Outgoing: wallet often infers chainId. Completed: node may omit chainId
 * (it is encoded in v for EIP-155 txs).
 */
interface Transaction {
  readonly to: string;
  readonly from: string;
  readonly value: string;
  readonly data: string;
  readonly chainId: string;
  readonly gas: string;
}

export { Transaction };
