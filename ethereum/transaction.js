import { Address } from "./address.d";
import { Transaction } from "./transaction.d";

/**
 * Internal struct for building a transaction. Props are mangleable.
 * @typedef {{
 *   to?: Address,
 *   from?: Address,
 *   value?: number | bigint,
 *   data?: string,
 *   chainId?: string,
 *   gas?: number
 * }}
 */
const TransactionRequest = {};

/**
 * @param {number | bigint} v 
 * @return {string}
 */
const hex = (v) => "0x" + v.toString(16);

/**
 * @param {TransactionRequest} req
 * @return {Transaction}
 */
const serialize = (req) => {
  const out = {};
  if (req.data != null) out.data = req.data;
  if (req.from != null) out.from = req.from;
  if (req.to != null) out.to = req.to;
  if (req.chainId) out.chainId = req.chainId;
  if (req.gas) out.gas = hex(req.gas);
  if (req.value) out.value = hex(req.value);
  return /** @type {Transaction} */(out);
};

export { serialize, TransactionRequest };
