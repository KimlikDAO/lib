import { solveAStar } from "./aStar";
import { trySolveAllKept } from "./simpleStrat";
import { Problem, Solution } from "./solver.d";
import { ProblemState } from "./state";

const solve = (problem: Problem): Solution => {
  const state = ProblemState.from(problem);
  const path = trySolveAllKept(state) ?? solveAStar(state);
  if (!path)
    throw new TypeError("solver failed to find path");
  return path;
}

export { solve };
