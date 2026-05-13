import { assert } from "../util/assert";
import { endsWith } from "../util/arrays";
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
  ruleDistance,
} from "./distance";
import { GraphNode } from "./graph";
import {
  ActionId,
  ProblemData,
  RuleInputs,
  StackState,
  ValueId,
} from "./solver.d";

type NodeId = ValueId | ActionId;

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

class Problem {
  private constructor(
    readonly keep: ValueId[],
    readonly output: ValueId,
    readonly rules: RuleInputs[],
    readonly stackVars: number,
    readonly maxStack: number,
  ) { }

  static fromProblemData(problemData: ProblemData): {
    problem: Problem;
    start: GraphNode;
  } {
    assert(problemData.output == 1, "Currently we support single output 1");
    assert(problemData.rules.length > 1, "At least 1 rule is needed");
    assert(problemData.rules[0].length == 0, "First rule must be empty");
    const stackVars = validateInitialStack(problemData.init);
    const keep = problemData.keep.sort((a, b) => a - b);
    assert(keep.length == 0 || -stackVars <= keep[0],
      `Keep list can only include init values`);
    const maxStack = problemData.init.length + keep.length + 16 +
      problemData.rules.reduce((sum, r) => sum + r.length, 0);
    const problem = new Problem(
      keep,
      problemData.output,
      problemData.rules,
      stackVars,
      maxStack,
    );
    return {
      problem,
      start: new GraphNode(
        problemData.init,
        BLANK_ACTION,
        null,
        0,
        problem.hScore(problemData.init),
      ),
    };
  }

  forEachNode(fn: (node: NodeId, pos: number) => void) {
    const { rules, output } = this;
    let pos = 0;
    const visit = (node: NodeId) => {
      const children = rules[node] || [];
      for (const child of children) { visit(child); ++pos; }
      fn(node, pos);
      pos -= children.length;
    }
    visit(output);
  }

  forEachWhiteNode(
    stack: StackState,
    fn: (node: NodeId, inputs: RuleInputs | undefined) => void,
  ) {
    const onStack = new Set(stack);
    const { rules, output } = this;
    const visit = (node: NodeId) => {
      if (node && onStack.has(node)) return;
      const inputs = rules[node];
      for (const child of inputs || []) visit(child);
      fn(node, inputs);
    }
    visit(output);
  }

  validActions(stack: StackState): ActionId[] {
    const actions: ActionId[] = [BLANK_ACTION];
    this.forEachWhiteNode(stack, (action, inputs) => {
      if (action && (!inputs || endsWith(stack, inputs)))
        actions.push(action);
    });
    for (let dup = 1; dup <= Math.min(16, stack.length); ++dup)
      if (stack[stack.length - dup] != 0)
        actions.push(DUP_ACTION(dup));
    const top = stack[stack.length - 1];
    for (let swap = 1; swap <= Math.min(16, stack.length - 1); ++swap)
      if (stack[stack.length - 1 - swap] != top)
        actions.push(SWAP_ACTION(swap));
    if (top == 0)
      actions.push(POP_ACTION);
    return actions;
  }

  hScore(stack: StackState): number {
    let score = 0;
    this.forEachWhiteNode(stack, (node, inputs) => {
      score += node ? APPLY_COST : 2;
      if (!inputs) return;
      score += ruleDistance(inputs, stack);
    });
    return score;
  }

  isGoal(stack: StackState): boolean {
    if (stack[stack.length - 1] != this.output)
      return false;
    const freq = Array(this.stackVars + 1);
    for (const k of this.keep)
      freq[-k] = 1;
    let toKeep = this.keep.length;
    for (const s of stack)
      if (s < 0 && freq[-s]) { freq[-s] = 0; --toKeep; }
    return toKeep == 0;
  }

  applyAction(searchNode: GraphNode, action: ActionId): GraphNode {
    const stack = this.applyStack(searchNode.stack, action);
    return new GraphNode(
      stack,
      action,
      searchNode,
      searchNode.g + gas(action),
      this.hScore(stack),
    );
  }

  private applyStack(stack: StackState, action: ActionId): StackState {
    const err = () => new Error(`invalid action ${action} for stack ${stack}`);
    if (action == BLANK_ACTION)
      return [...stack, 0];
    if (action == POP_ACTION) {
      if (stack.length) return stack.slice(0, -1);
      throw err();
    }
    const dup = dupIndex(action);
    if (dup) {
      if (stack.length >= dup)
        return [...stack, stack[stack.length - dup]!];
      throw err();
    }
    const swap = swapIndex(action);
    if (swap) {
      if (stack.length <= swap)
        throw err();
      const next = [...stack];
      const top = next.length - 1;
      const other = top - swap;
      [next[top], next[other]] = [next[other]!, next[top]!];
      return next;
    }
    if (action <= 0)
      throw err();
    const inputs = this.rules[action];
    if (!inputs)
      return [...stack, action];
    if (!endsWith(stack, inputs))
      throw err();
    const next = stack.slice(0, stack.length - inputs.length);
    next.push(action);
    return this.zeroUnusedInputs(next, inputs);
  }

  private zeroUnusedInputs(
    stack: StackState,
    inputs: RuleInputs,
  ): StackState {
    const candidates = new Set<ValueId>();
    for (const input of inputs)
      if (input)
        candidates.add(input);
    if (candidates.size == 0)
      return stack;

    const needed = new Set(this.keep);
    const onStack = new Set(stack);
    if (onStack.has(this.output))
      needed.add(this.output);
    this.forEachWhiteNode(stack, (_node, inputs) => {
      for (const child of inputs || [])
        if (child && onStack.has(child))
          needed.add(child);
    });

    let next: StackState | null = null;
    for (let i = 0; i < stack.length; ++i) {
      const value = stack[i]!;
      if (candidates.has(value) && !needed.has(value)) {
        next ||= [...stack];
        next[i] = 0;
      }
    }
    return next || stack;
  }
}

export { NodeId, Problem };
