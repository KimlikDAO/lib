import { GraphNode, compareGraphNodes } from "./graph";
import { Heap } from "./heap";
import { Problem } from "./problem";
import { Solution } from "./solver.d";

const MAX_EXPANSIONS = 100_000;

const solveAStar = (
  problem: Problem,
  start: GraphNode,
): Solution | null => {
  const frontier = Heap.empty<GraphNode>(compareGraphNodes);
  const best = new Map<number, number>();
  frontier.push(start);
  best.set(start.hash(), start.g);

  for (let expansions = 0; expansions < MAX_EXPANSIONS; ++expansions) {
    const curr = frontier.pop();
    if (!curr) break;
    const hash = curr.hash();
    if (best.get(hash) != curr.g) continue;
    if (problem.isGoal(curr.stack))
      return curr.incomingPath();

    for (const action of problem.validActions(curr.stack)) {
      const next = problem.applyAction(curr, action);
      if (next.stack.length > problem.maxStack) continue;
      const hash = next.hash();
      const previous = best.get(hash);
      if (previous !== undefined && previous <= next.g) continue;
      frontier.push(next);
      best.set(hash, next.g);
    }
  }
  return null;
}

export { solveAStar };
