import { solveAStar } from "./aStar";
import { trySolveAllKept } from "./simpleStrat";
import { Problem, Solution } from "./solver.d";
import { SearchNodeView } from "./state";

const solve = (problem: Problem): Solution => {
  const view = SearchNodeView.from(problem);
  const path = trySolveAllKept(view) ?? solveAStar(view);
  if (!path)
    throw new TypeError("solver failed to find path");
  return path;
}

export { solve };
