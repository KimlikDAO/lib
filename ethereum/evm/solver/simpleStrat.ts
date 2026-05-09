import {
  ActionId,
  BLANK_ACTION,
  DUP_ACTION,
  POP_ACTION,
} from "./action";
import { Path, Problem, forEachLeaf, forEachNode } from "./problem";

const computeDepths = (problem: Problem): number[] => {
  const depths = Array(problem.stackVars + 1);
  const n = problem.init.length;
  for (let d = 1; d <= n; ++d)
    depths[-problem.init[n - d]] = d;
  return depths;
}

const countTrailingZeros = (stack: readonly number[]): number => {
  let count = 0;
  for (let i = stack.length - 1; 0 <= i && stack[i] == 0; --i)
    ++count;
  return count;
}

const trySolveAllKept = (problem: Problem): Path | null => {
  if (problem.stackVars != problem.keep.length)
    return null;

  const depths = computeDepths(problem);
  let maxDepth = 0;
  forEachLeaf(problem, (leaf: ActionId, pos: number) => {
    if (leaf < 0)
      maxDepth = Math.max(maxDepth, pos + depths[-leaf])
  });
  const pop = Math.max(0, maxDepth - 16);
  if (countTrailingZeros(problem.init) < pop)
    return null;

  const actions = Array<ActionId>(pop).fill(POP_ACTION);
  const end = problem.init.slice(0, problem.init.length - pop);
  end.push(problem.output);

  forEachNode(problem, (node: ActionId, pos: number) => {
    if (node == 0)
      actions.push(BLANK_ACTION);
    else if (node < 0)
      actions.push(DUP_ACTION(pos + depths[-node] - pop));
    else
      actions.push(node);
  });
  return {
    beg: problem.init,
    actions,
    end
  };
}

export { trySolveAllKept };
