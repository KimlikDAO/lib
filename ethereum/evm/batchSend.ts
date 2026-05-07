import { Address } from "../address.d";
import { assemble, Program } from "./assembler";
import { call, pop } from "./builtins";
import { dup, set, unrollFor } from "./syntax";
import { Weis } from "./types";

type Recipient = { address: Address; amount: bigint };

const batchSend = (recipients: Recipient[]): Program => {
  const code = unrollFor(
    [],
    recipients,
    ({ address, amount }: Recipient) => call(0, address, amount, 0, 0, 0, 0),
  );
  return assemble(...code);
};

const batchSendFixedAmount = (
  recipients: Address[],
  amount: bigint,
): Program => {
  const code = unrollFor(
    set("amount", Weis, amount),
    recipients,
    (recipient) => [
      call(0, recipient, dup("amount"), 0, 0, 0, 0),
      pop()
    ]
  );
  return assemble(...code);
};

export { batchSend, batchSendFixedAmount, Recipient };
