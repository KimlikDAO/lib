import {
  BLANK_ACTION,
  DUP_ACTION,
  POP_ACTION,
} from "./action";
import { GraphNode } from "./graph";
import { NodeId, Problem } from "./problem";
import { ActionId, Solution } from "./solver.d";

const computeDepths = (
  problem: Problem,
  start: GraphNode,
): number[] => {
  const { stack } = start;
  const depths = Array(problem.stackVars + 1);
  const n = stack.length;
  for (let d = 1; d <= n; ++d)
    depths[-stack[n - d]] = d;
  return depths;
}

const countTrailingZeros = (stack: readonly number[]): number => {
  let count = 0;
  for (let i = stack.length - 1; 0 <= i && stack[i] == 0; --i)
    ++count;
  return count;
}

const trySolveAllKept = (
  problem: Problem,
  start: GraphNode,
): Solution | null => {
  const { stack } = start;
  if (problem.stackVars != problem.keep.length)
    return null;

  const depths = computeDepths(problem, start);
  let maxDepth = 0;
  problem.forEachNode((node: NodeId, pos: number) => {
    if (node < 0)
      maxDepth = Math.max(maxDepth, pos + depths[-node])
  });
  const pop = Math.max(0, maxDepth - 16);
  if (countTrailingZeros(stack) < pop)
    return null;

  const actions = Array<ActionId>(pop).fill(POP_ACTION);
  const end = stack.slice(0, stack.length - pop);
  end.push(problem.output);

  problem.forEachNode((node: NodeId, pos: number) => {
    if (node == 0)
      actions.push(BLANK_ACTION);
    else if (node < 0)
      actions.push(DUP_ACTION(pos + depths[-node] - pop));
    else
      actions.push(node);
  });
  return {
    beg: stack,
    actions,
    end
  };
}

export { trySolveAllKept };
