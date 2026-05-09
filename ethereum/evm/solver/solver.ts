import { Path, Problem } from "./problem";
import { trySolveAllKept } from "./simpleStrat";

const solve = (problem: Problem): Path => {
  const path = trySolveAllKept(problem);
  if (!path)
    throw new TypeError("solver failed to find path");
  return path;
}

export { solve };
