type ActionId = number;

const BLANK_ACTION: ActionId = 0;
const POP_ACTION: ActionId = -1;
const SWAP1_ACTION: ActionId = -2;
const SWAP16_ACTION: ActionId = -17;
const DUP1_ACTION: ActionId = -18;
const DUP16_ACTION: ActionId = -33;

const SWAP_ACTION = (n: number): ActionId => {
  if (n < 1 || n > 16)
    throw new RangeError(`SWAP action expects 1..16, received ${n}`);
  return SWAP1_ACTION + 1 - n;
}

const DUP_ACTION = (n: number): ActionId => {
  if (n < 1 || n > 16)
    throw new RangeError(`DUP action expects 1..16, received ${n}`);
  return DUP1_ACTION + 1 - n;
}

const swapIndex = (action: ActionId): number =>
  SWAP16_ACTION <= action && action <= SWAP1_ACTION
    ? -1 - action : 0;

const dupIndex = (action: ActionId): number =>
  DUP16_ACTION <= action && action <= DUP1_ACTION
    ? -17 - action : 0;

export {
  BLANK_ACTION,
  DUP16_ACTION,
  DUP1_ACTION,
  DUP_ACTION,
  POP_ACTION,
  SWAP16_ACTION,
  SWAP1_ACTION,
  SWAP_ACTION,
  ActionId,
  dupIndex,
  swapIndex,
};
