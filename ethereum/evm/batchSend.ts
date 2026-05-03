import { Address } from "../address.d";
import { assemble, Program } from "./assembler";
import { call, pop, push, unrollFor } from "./combinators";
import { get, Weis } from "./types";

type Recipient = { address: Address; amount: bigint };

const batchSend = (recipients: Recipient[]): Program => {
  const code = unrollFor(
    [],
    recipients,
    ({ address, amount }: Recipient) => call(0, address, amount, 0, 0, 0, 0),
  );
  return assemble(code);
};

const batchSendFixedAmount = (
  recipients: Address[],
  amount: bigint,
): Program => {
  const code = unrollFor(
    push(amount, Weis),
    recipients,
    (recipient) => [
      call(0, recipient, get(1), 0, 0, 0, 0),
      pop()
    ]
  );
  return assemble(code);
};

export { batchSend, batchSendFixedAmount, Recipient };
