import { assert } from "../util";
import {
  BLANK_ACTION,
  DUP_ACTION,
  POP_ACTION,
  SWAP_ACTION,
  dupIndex,
  swapIndex,
} from "./action";
import {
  ActionId,
  Problem,
  RuleInputs,
  StackState,
  ValueId,
} from "./solver.d";

interface PresentChild {
  readonly input: number;
  readonly stack: number;
}

class ProblemState {
  private green?: Set<ValueId>;

  constructor(
    readonly keep: ValueId[],
    readonly output: ValueId,
    readonly rules: RuleInputs[],
    readonly state: StackState,
    readonly stackVars = countStackVars(state),
  ) { }

  static from(problem: Problem): ProblemState {
    assert(problem.output == 1, "Currently we support single output 1");
    assert(problem.rules.length > 1, "At least 1 rule is needed");
    assert(problem.rules[0].length == 0, "First rule must be empty");
    const stackVars = validateInitialStack(problem.init);
    const keep = [...problem.keep].sort((a, b) => a - b);
    assert(keep.length == 0 || -stackVars <= keep[0],
      `Keep list can only include init values`);
    return new ProblemState(
      keep,
      problem.output,
      problem.rules,
      problem.init,
      stackVars,
    );
  }

  withState(state: StackState): ProblemState {
    return this.next(state);
  }

  apply(action: ActionId): ProblemState | null {
    const { state } = this;
    if (action == BLANK_ACTION)
      return this.next([...state, 0]);

    if (action == POP_ACTION)
      return state.length ? this.next(state.slice(0, -1)) : null;

    const dup = dupIndex(action);
    if (dup)
      return state.length >= dup
        ? this.next([...state, state[state.length - dup]!])
        : null;

    const swap = swapIndex(action);
    if (swap) {
      if (state.length <= swap) return null;
      const next = [...state];
      const top = next.length - 1;
      const other = top - swap;
      [next[top], next[other]] = [next[other]!, next[top]!];
      return this.next(next);
    }

    if (action <= 0) return null;

    const inputs = this.rules[action];
    if (!inputs)
      return this.next([...state, action]);
    if (!endsWith(state, inputs))
      return null;
    const next = state.slice(0, state.length - inputs.length);
    next.push(action);
    return this.next(next);
  }

  candidateActions(maxStack: number): ActionId[] {
    const actions = this.whiteLeafActions();
    if (this.state.length < maxStack) {
      if (actions.some((action) => this.rules[action]?.includes(0)))
        actions.push(BLANK_ACTION);
      for (let dup = 1; dup <= Math.min(16, this.state.length); ++dup)
        if (this.state[this.state.length - dup] != 0)
          actions.push(DUP_ACTION(dup));
    }
    for (let swap = 1; swap <= Math.min(16, this.state.length - 1); ++swap)
      actions.push(SWAP_ACTION(swap));
    if (this.canPop())
      actions.push(POP_ACTION);
    return actions;
  }

  whiteLeafActions(): ActionId[] {
    const actions: ActionId[] = [];
    this.forEachWhite((action) => {
      if (this.isWhiteLeaf(action))
        actions.push(action);
    });
    return actions;
  }

  isGoal(): boolean {
    if (this.state[this.state.length - 1] != this.output) return false;
    for (const kept of this.keep)
      if (!this.state.includes(kept))
        return false;
    return true;
  }

  forEachGreen(fn: (value: ValueId) => void) {
    this.collectGreen().forEach(fn);
  }

  forEachWhite(fn: (action: ActionId) => void) {
    const seen = new Set<ActionId>();
    const visit = (action: ValueId) => {
      if (action <= 0 || seen.has(action) || this.isGreen(action)) return;
      seen.add(action);
      fn(action);
      const inputs = this.rules[action];
      if (inputs)
        for (const input of inputs) visit(input);
    }
    visit(this.output);
  }

  presentChildren(inputs: readonly ValueId[]): PresentChild[] {
    const present: PresentChild[] = [];
    const used = new Set<number>();
    for (let input = 0; input < inputs.length; ++input) {
      const value = inputs[input]!;
      if (!this.isAvailableInput(value)) continue;
      for (let stack = 0; stack < this.state.length; ++stack) {
        if (!used.has(stack) && this.state[stack] == value) {
          present.push({ input, stack });
          used.add(stack);
          break;
        }
      }
    }
    return present;
  }

  isGreen(value: ValueId): boolean {
    return value > 0
      ? this.collectGreen().has(value)
      : this.state.includes(value);
  }

  isAvailableInput(value: ValueId): boolean {
    return value == 0 || this.isGreen(value);
  }

  private canPop(): boolean {
    const top = this.state[this.state.length - 1];
    return top !== undefined && top != this.output && !this.keep.includes(top);
  }

  private collectGreen(): ReadonlySet<ValueId> {
    if (this.green) return this.green;
    const green = new Set<ValueId>();
    const visit = (value: ValueId) => {
      if (value <= 0 || green.has(value)) return;
      green.add(value);
      const inputs = this.rules[value];
      if (inputs)
        for (const input of inputs) visit(input);
    }
    for (const value of this.state) visit(value);
    return this.green = green;
  }

  private isWhiteLeaf(action: ActionId): boolean {
    const inputs = this.rules[action];
    if (!inputs) return true;
    for (const input of inputs)
      if (!this.isAvailableInput(input))
        return false;
    return true;
  }

  private next(state: StackState): ProblemState {
    return new ProblemState(
      this.keep,
      this.output,
      this.rules,
      state,
      this.stackVars,
    );
  }
}

const forEachNode = (
  problem: Pick<Problem | ProblemState, "rules" | "output">,
  fn: (actionId: ActionId, pos: number) => void
) => {
  const { rules, output } = problem;
  let pos = 0;
  const visit = (actionId: ActionId) => {
    const children = rules[actionId] || [];
    for (const child of children) { visit(child); ++pos; }
    fn(actionId, pos);
    pos -= children.length;
  }
  visit(output);
}

const countStackVars = (init: readonly ValueId[]): number => {
  let min = 0;
  for (const value of init)
    if (value < min)
      min = value;
  return -min;
}

const validateInitialStack = (init: readonly ValueId[]): number => {
  let last = 0;
  let vars = 0;
  for (const i of init)
    if (i == 0) { }
    else if (last == 0) {
      assert(i < 0, `Invalid init: expected negative stack ref, found ${i}.`);
      vars = last = i;
    } else {
      assert(i == last + 1,
        `Invalid init: expected ${last + 1}, found ${i}.`);
      last = i;
    }
  return -vars;
}

const endsWith = (
  stack: readonly ValueId[],
  suffix: readonly ValueId[],
): boolean => {
  if (stack.length < suffix.length) return false;
  const offset = stack.length - suffix.length;
  for (let i = 0; i < suffix.length; ++i)
    if (stack[offset + i] != suffix[i])
      return false;
  return true;
}

export {
  PresentChild,
  ProblemState, forEachNode
};
