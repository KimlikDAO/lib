type ValueId = number;
type ActionId = number;
type StackState = ValueId[];
type RuleInputs = ValueId[];

interface Problem {
  readonly init: StackState;
  readonly keep: ValueId[];
  readonly output: ValueId;
  readonly rules: RuleInputs[];
}

interface Solution {
  readonly beg: StackState;
  readonly actions: ActionId[];
  readonly end: StackState;
}

export {
  ActionId,
  Problem,
  RuleInputs,
  Solution,
  StackState,
  ValueId,
};
