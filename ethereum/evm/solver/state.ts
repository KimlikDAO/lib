import { assert } from "../util";
import { hashArray } from "../util/arrays";
import {
  BLANK_ACTION,
  DUP_ACTION,
  POP_ACTION,
  SWAP_ACTION,
  dupIndex,
  gas,
  swapIndex,
} from "./action";
import {
  APPLY_COST,
  UNKNOWN_SUBTREE_COST,
  ruleDistance,
} from "./distance";
import {
  ActionId,
  Path,
  Problem,
  RuleInputs,
  StackState,
  ValueId,
} from "./solver.d";

interface PresentChild {
  readonly input: number;
  readonly stack: number;
}

/**
 * Represents a node in the search graph. It knows the {@link SearchNode} from
 * which the present node was obtain, and know through which action it was
 * obtained.
 */
class SearchNode {
  constructor(
    readonly stack: StackState,
    readonly action: ActionId,
    readonly prev: SearchNode | null,
    readonly g: number,
    public h: number
  ) { }

  get f(): number {
    return this.g + this.h;
  }

  hash(): number {
    return hashArray(this.stack);
  }

  incomingPath(): Path {
    const actions: ActionId[] = [];
    let node: SearchNode = this;
    for (; node.prev; node = node.prev)
      actions.push(node.action);
    return {
      beg: node.stack,
      actions: actions.reverse(),
      end: this.stack,
    };
  }
}

class SearchNodeView {
  private green?: Set<ValueId>;

  constructor(
    readonly keep: ValueId[],
    readonly output: ValueId,
    readonly rules: RuleInputs[],
    readonly stack: StackState,
    readonly node: SearchNode,
    readonly stackVars: number,
    readonly maxStack: number,
  ) { }

  static from(problem: Problem): SearchNodeView {
    assert(problem.output == 1, "Currently we support single output 1");
    assert(problem.rules.length > 1, "At least 1 rule is needed");
    assert(problem.rules[0].length == 0, "First rule must be empty");
    const stackVars = validateInitialStack(problem.init);
    const keep = problem.keep.sort((a, b) => a - b);
    assert(keep.length == 0 || -stackVars <= keep[0],
      `Keep list can only include init values`);
    const maxStack = problem.init.length + keep.length + 16 +
      problem.rules.reduce((sum, r) => sum + r.length, 0);
    const node = new SearchNode(problem.init, BLANK_ACTION, null, 0, 0);
    const view = new SearchNodeView(
      keep,
      problem.output,
      problem.rules,
      problem.init,
      node,
      stackVars,
      maxStack,
    );
    node.h = view.hScore();
    return view;
  }

  static ofNode(node: SearchNode, source: SearchNodeView): SearchNodeView {
    return new SearchNodeView(
      source.keep,
      source.output,
      source.rules,
      node.stack,
      node,
      source.stackVars,
      source.maxStack,
    );
  }

  getNeighbor(action: ActionId): SearchNode | null {
    const stack = this.applyStack(action);
    if (!stack) return null;
    const g = this.node.g + gas(action);
    const h = this.hScore(stack);
    return new SearchNode(stack, action, this.node, g, h);
  }

  private applyStack(action: ActionId): StackState | null {
    const { stack } = this;
    if (action == BLANK_ACTION)
      return [...stack, 0];

    if (action == POP_ACTION)
      return stack.length ? stack.slice(0, -1) : null;

    const dup = dupIndex(action);
    if (dup)
      return stack.length >= dup
        ? [...stack, stack[stack.length - dup]!]
        : null;

    const swap = swapIndex(action);
    if (swap) {
      if (stack.length <= swap) return null;
      const next = [...stack];
      const top = next.length - 1;
      const other = top - swap;
      [next[top], next[other]] = [next[other]!, next[top]!];
      return next;
    }
    if (action <= 0) return null;
    const inputs = this.rules[action];
    if (!inputs)
      return [...stack, action];
    if (!endsWith(stack, inputs))
      return null;
    const next = stack.slice(0, stack.length - inputs.length);
    next.push(action);
    return next;
  }

  candidateActions(): ActionId[] {
    const actions = this.whiteLeafActions();
    const { stack } = this;
    if (stack.length < this.maxStack) {
      if (actions.some((action) => this.rules[action]?.includes(0)))
        actions.push(BLANK_ACTION);
      for (let dup = 1; dup <= Math.min(16, stack.length); ++dup)
        if (stack[stack.length - dup] != 0)
          actions.push(DUP_ACTION(dup));
    }
    for (let swap = 1; swap <= Math.min(16, stack.length - 1); ++swap)
      actions.push(SWAP_ACTION(swap));
    const top = stack[stack.length - 1];
    if (top !== undefined && top != this.output && !this.keep.includes(top))
      actions.push(POP_ACTION);
    return actions;
  }

  whiteLeafActions(stack = this.stack): ActionId[] {
    const actions: ActionId[] = [];
    this.forEachWhite((action) => {
      if (this.isWhiteLeaf(action, stack))
        actions.push(action);
    }, stack);
    return actions;
  }

  isGoal(): boolean {
    const { stack, keep } = this;
    if (stack[stack.length - 1] != this.output)
      return false;
    const freq = Array(this.stackVars + 1);
    for (const k of keep)
      freq[-k] = 1;
    let toKeep = keep.length;
    for (const s of stack)
      if (s < 0 && freq[-s]) { freq[-s] = 0; --toKeep; }
    return toKeep == 0;
  }

  forEachGreen(fn: (value: ValueId) => void, stack = this.stack) {
    this.collectGreen(stack).forEach(fn);
  }

  forEachWhite(fn: (action: ActionId) => void, stack = this.stack) {
    const seen = new Set<ActionId>();
    const visit = (action: ValueId) => {
      if (action <= 0 || seen.has(action) || this.isGreen(action, stack))
        return;
      seen.add(action);
      fn(action);
      const inputs = this.rules[action];
      if (inputs)
        for (const input of inputs) visit(input);
    }
    visit(this.output);
  }

  presentChildren(
    inputs: readonly ValueId[],
    stack = this.stack,
  ): PresentChild[] {
    const present: PresentChild[] = [];
    const used = new Set<number>();
    for (let input = 0; input < inputs.length; ++input) {
      const value = inputs[input]!;
      if (!this.isAvailableInput(value, stack)) continue;
      for (let pos = 0; pos < stack.length; ++pos) {
        if (!used.has(pos) && stack[pos] == value) {
          present.push({ input, stack: pos });
          used.add(pos);
          break;
        }
      }
    }
    return present;
  }

  hScore(stack = this.stack): number {
    if (this.isGreen(this.output, stack))
      return 0;

    let score = 0;
    let found = false;
    this.forEachWhite((action) => {
      const inputs = this.rules[action];
      if (!inputs) return;
      score += APPLY_COST;
      found = true;
      const contribution = ruleDistance(inputs, stack,
        this.presentChildren(inputs, stack));
      if (contribution == null) return;
      score += contribution;
    }, stack);
    return found ? score : UNKNOWN_SUBTREE_COST;
  }

  isGreen(value: ValueId, stack = this.stack): boolean {
    return value > 0
      ? this.collectGreen(stack).has(value)
      : stack.includes(value);
  }

  isAvailableInput(value: ValueId, stack = this.stack): boolean {
    return value == 0 || this.isGreen(value, stack);
  }

  private collectGreen(stack = this.stack): ReadonlySet<ValueId> {
    if (stack == this.stack && this.green) return this.green;
    const green = new Set<ValueId>();
    const visit = (value: ValueId) => {
      if (value <= 0 || green.has(value)) return;
      green.add(value);
      const inputs = this.rules[value];
      if (inputs)
        for (const input of inputs) visit(input);
    }
    for (const value of stack) visit(value);
    if (stack == this.stack)
      this.green = green;
    return green;
  }

  private isWhiteLeaf(action: ActionId, stack = this.stack): boolean {
    const inputs = this.rules[action];
    if (!inputs) return true;
    for (const input of inputs)
      if (!this.isAvailableInput(input, stack))
        return false;
    return true;
  }
}

const forEachNode = (
  problem: Pick<Problem | SearchNodeView, "rules" | "output">,
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
  SearchNode,
  SearchNodeView,
  forEachNode
};
