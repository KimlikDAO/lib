import { assert } from "../util";
import { ActionId } from "./action";

type ValueId = number;

class Problem {
  stackVars: number;
  constructor(
    readonly init: ValueId[],
    readonly keep: ValueId[],
    readonly output: ValueId,
    readonly rules: ActionId[][]
  ) {
    assert(output == 1, "Currently we suppor single output 1");
    assert(rules.length > 1, "At least 1 rule is needed");
    assert(rules[0].length == 0, "First rule must be empty");
    let last = 0;
    let vars = 0;
    for (const i of init)
      if (i == 0) { }
      else if (last == 0) vars = last = i;
      else {
        assert(i == last + 1,
          `Invalid init: expected ${last + 1}, found ${i}.`);
        last = i;
      }
    keep.sort((a, b) => a - b);
    assert(keep.length == 0 || vars <= keep[0],
      `Keep list can only include init values`);
    this.stackVars = -vars;
  }
}

interface Path {
  readonly beg: ValueId[];
  readonly actions: ActionId[];
  readonly end: ValueId[];
}

const forEachLeaf = (
  problem: Problem,
  fn: (actionId: ActionId, pos: number) => void
) => {
  const { rules, output } = problem;
  let pos = 0;
  const visit = (actionId: ActionId) => {
    let children = rules[actionId];
    if (actionId && children) {
      for (const child of children) { visit(child); ++pos; }
      pos -= children.length;
    } else
      fn(actionId, pos);
  }
  visit(output);
}

const forEachNode = (
  problem: Problem,
  fn: (actionId: ActionId, pos: number) => void
) => {
  const { rules, output } = problem;
  let pos = 0;
  const visit = (actionId: ActionId) => {
    const children = rules[actionId];
    if (actionId && children) {
      for (const child of children) { visit(child); ++pos; }
      fn(actionId, pos);
      pos -= children.length;
    } else
      fn(actionId, pos);
  }
  visit(output);
}

export {
  Path,
  Problem,
  ValueId,
  forEachLeaf,
  forEachNode,
};
