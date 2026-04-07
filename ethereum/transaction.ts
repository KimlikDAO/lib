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

const hex = (v: number | bigint): string => "0x" + (v as bigint).toString(16);

/** @satisfies {PureFn} */
const serialize = (req: TransactionRequest): Transaction => {
  return {
    data: req.data ?? "0x",
    from: req.from ?? "0x",
    to: req.to ?? "0x",
    chainId: req.chainId ?? "0x0",
    gas: req.gas == null ? "0x0" : hex(req.gas),
    value: req.value == null ? "0x0" : hex(req.value),
  } as Transaction;
};

export { serialize, TransactionRequest };
