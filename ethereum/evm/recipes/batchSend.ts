import { Address } from "../../address.d";
import { assemble, Program } from "../assembler";
import { call } from "../builtins";
import { get } from "../expression";
import { set, unrollFor } from "../statement";
import { Weis } from "../types";

type Recipient = { address: Address; amount: bigint };

const batchSend = (recipients: Recipient[]): Program => {
  return assemble(unrollFor(
    [],
    recipients,
    ({ address, amount }) => call(0, address, amount, 0, 0, 0, 0),
  ));
};

const batchSendFixedAmount = (
  recipients: Address[],
  amount: bigint,
): Program => {
  return assemble(unrollFor(
    set("amount", Weis, amount),
    recipients,
    (recipient) => call(0, recipient, get("amount"), 0, 0, 0, 0)
  ));
};

export { batchSend, batchSendFixedAmount, Recipient };
