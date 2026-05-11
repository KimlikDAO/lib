import { Heap } from "./heap";
import { APPLY_COST, hScore } from "./heuristic";
import { ActionId, Problem, Solution, StackState, ValueId } from "./solver.d";
import { forEachNode, ProblemState } from "./state";

const MAX_EXPANSIONS = 100_000;

interface SearchNode {
  readonly stack: StackState;
  readonly action: ActionId;
  readonly parent: SearchNode | null;
  readonly g: number;
  readonly h: number;
}

const hashState = (state: readonly number[]): number => {
  let lo = 0x811c9dc5 ^ state.length;
  let hi = 0x9e3779b9 ^ state.length;
  for (const value of state) {
    const mixed = mixSigned(value);
    lo = Math.imul(lo ^ mixed, 0x01000193);
    hi = Math.imul(((hi << 13) | (hi >>> 19)) ^ mixed, 0x85ebca6b);
  }
  lo = fmix32(lo);
  hi = fmix32(hi ^ lo);
  return ((hi >>> 11) * 0x100000000) + (lo >>> 0);
}

const solveAStar = (
  startState: ProblemState,
): Solution | null => {
  const maxStack = maxSearchStack(startState);
  const start = makeNode(startState, 0, null, 0);
  const frontier = Heap.empty<SearchNode>(compareSearchNode);
  const best = new Map<number, number>();
  frontier.push(start);
  best.set(hashState(start.stack), 0);

  for (let expansions = 0; expansions < MAX_EXPANSIONS; ++expansions) {
    const node = frontier.pop();
    if (!node) break;
    const stateHash = hashState(node.stack);
    if (best.get(stateHash) != node.g) continue;
    const problemState = startState.withState(node.stack);
    if (problemState.isGoal())
      return pathTo(startState.state, node);

    for (const action of problemState.candidateActions(maxStack)) {
      const next = problemState.apply(action);
      if (!next || next.state.length > maxStack) continue;
      const g = node.g + APPLY_COST;
      const hash = hashState(next.state);
      const previous = best.get(hash);
      if (previous !== undefined && previous <= g) continue;
      best.set(hash, g);
      frontier.push(makeNode(next, action, node, g));
    }
  }
  return null;
}

const applyAction = (
  problem: Problem,
  stack: readonly ValueId[],
  action: ActionId,
): ValueId[] | null => {
  const next = ProblemState.from(problem).withState([...stack]).apply(action);
  return next ? [...next.state] : null;
}

const validPositiveActions = (
  problem: Problem,
  stack: readonly ValueId[],
): ActionId[] =>
  ProblemState.from(problem).withState([...stack]).whiteLeafActions();

const makeNode = (
  state: ProblemState,
  action: ActionId,
  parent: SearchNode | null,
  g: number,
): SearchNode => ({
  stack: state.state,
  action,
  parent,
  g,
  h: hScore(state),
});

const compareSearchNode = (
  a: SearchNode,
  b: SearchNode,
): number => (a.g + a.h) - (b.g + b.h) || a.h - b.h || b.g - a.g;

const pathTo = (
  beg: StackState,
  node: SearchNode,
): Solution => {
  const actions: ActionId[] = [];
  for (let current: SearchNode | null = node; current.parent;
    current = current.parent)
    actions.push(current.action);
  actions.reverse();
  return {
    beg,
    actions,
    end: node.stack,
  };
}

const maxSearchStack = (problem: ProblemState): number => {
  let occurrences = 0;
  forEachNode(problem, () => ++occurrences);
  return problem.state.length + occurrences + problem.keep.length + 16;
}

const mixSigned = (value: number): number => {
  const signed = value | 0;
  return ((signed << 1) ^ (signed >> 31)) >>> 0;
}

const fmix32 = (value: number): number => {
  value ^= value >>> 16;
  value = Math.imul(value, 0x7feb352d);
  value ^= value >>> 15;
  value = Math.imul(value, 0x846ca68b);
  value ^= value >>> 16;
  return value >>> 0;
}

export {
  applyAction,
  hashState,
  solveAStar,
  validPositiveActions
};
