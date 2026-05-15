import { Address } from "../../address.d";
import { assemble, Program } from "../assembler";
import { call } from "../builtins";
import { get } from "../expression";
import type { Body } from "../scope";
import { set, unrollFor } from "../statement";
import { Weis } from "../types";

type Recipient = { address: Address; amount: bigint };
type RecipientGroup = { amount: bigint; recipients: Address[] };

const fixedAmountBody = (
  recipients: readonly Address[],
  amount: bigint,
): Body => {
  if (recipients.length == 0)
    return [];
  if (recipients.length == 1)
    return [call(0, recipients[0]!, amount, 0, 0, 0, 0)];
  return unrollFor(
    set("amount", Weis, amount),
    [...recipients],
    (recipient) => call(0, recipient, get("amount"), 0, 0, 0, 0),
  );
}

const batchSend = (recipients: Recipient[]): Program => assemble(unrollFor(
  [],
  groupByAmount(recipients),
  ({ recipients, amount }) => fixedAmountBody(recipients, amount),
));

const batchSendFixedAmount = (
  recipients: Address[],
  amount: bigint,
): Program => assemble(fixedAmountBody(recipients, amount));

const groupByAmount = (recipients: readonly Recipient[]): RecipientGroup[] => {
  const sorted = [...recipients].sort((a, b) =>
    a.amount < b.amount ? -1 : a.amount > b.amount ? 1 : 0);
  const groups: RecipientGroup[] = [];
  for (const { address, amount } of sorted) {
    const last = groups[groups.length - 1];
    if (last?.amount == amount)
      last.recipients.push(address);
    else
      groups.push({ amount, recipients: [address] });
  }
  return groups;
}

export {
  batchSend,
  batchSendFixedAmount,
  fixedAmountBody,
  Recipient,
};
