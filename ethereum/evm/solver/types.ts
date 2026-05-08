type ValueId = number;
type ActionId = number;

type SearchAction = {
  readonly id: ActionId;
  readonly inputs: readonly ValueId[];
  readonly output: ValueId;
};

type SearchState = {
  readonly stack: ValueId[];
  readonly actions: readonly ActionId[];
};

type SearchProblem = {
  readonly initial: SearchState;
  readonly keep: readonly ValueId[];
  readonly output: ValueId;
  readonly actionsById: ReadonlyMap<ActionId, SearchAction>;
  readonly goal: (state: SearchState) => boolean;
};

class Path {
  readonly start: SearchState;
  readonly actions: readonly ActionId[];
  readonly end: SearchState;

  constructor(
    start: SearchState,
    actions: readonly ActionId[] = [],
    end: SearchState = start,
  ) {
    this.start = start;
    this.actions = actions;
    this.end = end;
  }

  extend(action: ActionId, end: SearchState): Path {
    return new Path(this.start, [...this.actions, action], end);
  }
}

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
  DUP_ACTION,
  DUP1_ACTION,
  DUP16_ACTION,
  POP_ACTION,
  Path,
  SWAP_ACTION,
  SWAP1_ACTION,
  SWAP16_ACTION,
  ActionId,
  SearchAction,
  SearchProblem,
  SearchState,
  ValueId,
  dupIndex,
  swapIndex,
};
