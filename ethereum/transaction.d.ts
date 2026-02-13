/**
 * @fileoverview Ethereum transaction definitions.
 *
 * @author KimlikDAO
 */

/**
 * Represents an ethereum transaction, to be sent to a provider.
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
