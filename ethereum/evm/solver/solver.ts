import { solveAStar } from "./aStar";
import { trySolveAllKept } from "./simpleStrat";
import { ProblemData, Solution } from "./solver.d";
import { Problem } from "./problem";

const solve = (problemData: ProblemData): Solution => {
  const { problem, start } = Problem.fromProblemData(problemData);
  const path = trySolveAllKept(problem, start)
    ?? solveAStar(problem, start);
  if (!path)
    throw new TypeError("solver failed to find path");
  return path;
}

export { solve };
