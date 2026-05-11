import { Heap } from "./heap";
import { Solution } from "./solver.d";
import { SearchNode, SearchNodeView } from "./state";

const MAX_EXPANSIONS = 100_000;

const solveAStar = (problem: SearchNodeView): Solution | null => {
  const initialView = problem;
  const start = initialView.node;
  const frontier = Heap.empty<SearchNode>(compareSearchNode);
  const best = new Map<number, number>();
  frontier.push(start);
  best.set(start.hash(), start.g);

  for (let expansions = 0; expansions < MAX_EXPANSIONS; ++expansions) {
    const curr = frontier.pop();
    if (!curr) break;
    const hash = curr.hash();
    if (best.get(hash) != curr.g) continue;
    const view = SearchNodeView.ofNode(curr, initialView);
    if (view.isGoal())
      return curr.incomingPath();

    for (const action of view.candidateActions()) {
      const next = view.getNeighbor(action);
      if (!next || next.stack.length > view.maxStack) continue;
      const hash = next.hash();
      const previous = best.get(hash);
      if (previous !== undefined && previous <= next.g) continue;
      best.set(hash, next.g);
      frontier.push(next);
    }
  }
  return null;
}

const compareSearchNode = (
  a: SearchNode,
  b: SearchNode,
): number => a.f - b.f || a.h - b.h || b.g - a.g;

export { solveAStar };
