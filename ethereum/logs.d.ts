/**
 * @fileoverview Etherem logs definitions.
 *
 * @author KimlikDAO
 */

/**
 * Represents a `eth_getLogs` request parameters.
 */
interface GetLogs {
  readonly fromBlock: string;
  readonly toBlock: string;
  readonly address: string;
  readonly topics: string[];
}

export { GetLogs };
