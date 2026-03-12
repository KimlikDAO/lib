import { Address } from "./address.d";
import { Transaction } from "./transaction.d";

type TransactionRequest = {
  to?: Address;
  from?: Address;
  value?: number | bigint;
  data?: string;
  chainId?: string;
  gas?: number;
};

const hex = (v: number | bigint): string => "0x" + v.toString(16);

/** @pure */
const serialize = (req: TransactionRequest): Transaction => {
  const out: any = {};
  if (req.data != null) out["data"] = req.data;
  if (req.from != null) out["from"] = req.from;
  if (req.to != null) out["to"] = req.to;
  if (req.chainId) out["chainId"] = req.chainId;
  if (req.gas) out["gas"] = hex(req.gas);
  if (req.value) out["value"] = hex(req.value);
  return out as Transaction;
};

export { serialize, TransactionRequest };
