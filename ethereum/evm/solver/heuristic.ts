import { ValueId } from "./solver.d";
import { PresentChild, ProblemState } from "./state";

const INSERT_COST = 3;
const APPLY_COST = 3;
const UNKNOWN_SUBTREE_COST = 3;

const hScore = (
  state: ProblemState,
): number => {
  if (state.isGreen(state.output))
    return 0;

  let score = 0;
  let found = false;
  state.forEachWhite((action) => {
    if (!state.rules[action]) return;
    score += APPLY_COST;
    found = true;
    const contribution = ruleScore(state, action);
    if (contribution == null) return;
    score += contribution;
  });
  return found ? score : UNKNOWN_SUBTREE_COST;
}

const starDistance = (
  inputs: readonly ValueId[],
  stack: readonly ValueId[],
  green = positiveStackValues(stack),
): number => {
  const present = presentChildren(inputs, stack, green);
  return present.length
    ? projectedStarSwaps(inputs, stack, present, inputs.length - present.length)
    : 0;
}

const ruleScore = (
  state: ProblemState,
  action: ValueId,
): number | null => {
  const inputs = state.rules[action];
  if (!inputs) return UNKNOWN_SUBTREE_COST;
  const present = state.presentChildren(inputs);
  if (present.length == 0) return null;
  const missing = inputs.length - present.length;
  return (projectedStarSwaps(inputs, state.state, present, missing)
    + missing) * INSERT_COST;
}

const isAvailable = (
  value: ValueId,
  stack: readonly ValueId[],
  green: ReadonlySet<ValueId>,
): boolean =>
  value == 0 || (value > 0 ? green.has(value) : stack.includes(value));

const positiveStackValues = (stack: readonly ValueId[]): Set<ValueId> => {
  const green = new Set<ValueId>();
  for (const value of stack)
    if (0 < value)
      green.add(value);
  return green;
}

const presentChildren = (
  inputs: readonly ValueId[],
  stack: readonly ValueId[],
  green: ReadonlySet<ValueId>,
): PresentChild[] => {
  const present: PresentChild[] = [];
  const used = new Set<number>();
  for (let input = 0; input < inputs.length; ++input) {
    const value = inputs[input]!;
    if (!isAvailable(value, stack, green)) continue;
    for (let pos = 0; pos < stack.length; ++pos) {
      if (!used.has(pos) && stack[pos] == value) {
        present.push({ input, stack: pos });
        used.add(pos);
        break;
      }
    }
  }
  return present;
}

// Project the directly available inputs onto their eventual suffix homes.
// Missing inputs are modeled as future pushes/holes and charged separately by
// ruleScore.
const projectedStarSwaps = (
  inputs: readonly ValueId[],
  stack: readonly ValueId[],
  present: readonly PresentChild[],
  missing: number,
): number => {
  const finalLength = stack.length + missing;
  const suffixStart = finalLength - inputs.length;
  const tokenAtStack = new Map<number, number>();
  const presentTokens = new Set<number>();
  for (const child of present) {
    tokenAtStack.set(child.stack, child.input);
    presentTokens.add(child.input);
  }

  const next = new Map<number, number>();
  const incoming = new Map<number, number>();
  for (const child of present) {
    const home = suffixStart + child.input;
    const occupant = tokenAtStack.get(home) ?? -1;
    if (occupant == child.input) continue;
    next.set(child.input, occupant);
    if (occupant != -1)
      incoming.set(occupant, (incoming.get(occupant) ?? 0) + 1);
  }

  const seen = new Set<number>();
  const pivot = inputs.length - 1;
  const pivotHome = suffixStart + pivot;
  const prefix = orderedPrefix(inputs, stack);
  const rightmostPresent = tokenAtStack.has(stack.length - 1);
  let openLength = 0;
  let openCount = 0;
  let openTouchesPivot = false;
  for (const child of present) {
    const start = child.input;
    if (seen.has(start) || !next.has(start) || incoming.has(start))
      continue;
    ++openCount;
    for (let token = start; token != -1 && !seen.has(token);) {
      seen.add(token);
      ++openLength;
      openTouchesPivot ||= token == pivot;
      token = next.get(token) ?? -1;
    }
  }

  let cycleCost = 0;
  let nonPivotCycles = 0;
  for (const child of present) {
    let token = child.input;
    if (seen.has(token) || !next.has(token)) continue;
    let length = 0;
    let touchesPivot = false;
    do {
      seen.add(token);
      ++length;
      touchesPivot ||= token == pivot;
      token = next.get(token)!;
    } while (!seen.has(token));

    if (touchesPivot)
      cycleCost += length - 1;
    else {
      cycleCost += length + 1;
      ++nonPivotCycles;
    }
  }

  if (!presentTokens.has(pivot) && openCount == 0 && nonPivotCycles)
    cycleCost -= 2;

  let openCost = 0;
  if (openCount) {
    const openAdjustment =
      openTouchesPivot && pivotHome < stack.length ? -1 :
        !presentTokens.has(pivot) && (prefix || rightmostPresent) ? -1 :
          openTouchesPivot ? 0 : 1;
    openCost = openLength + openCount + openAdjustment;
  }
  return cycleCost + openCost;
}

const orderedPrefix = (
  inputs: readonly ValueId[],
  stack: readonly ValueId[],
): number => {
  const n = Math.min(inputs.length, stack.length);
  for (let len = n; 0 < len; --len)
    for (let start = 0; start <= stack.length - len; ++start)
      if (matches(inputs, stack, len, start))
        return len;
  return 0;
}

const matches = (
  inputs: readonly ValueId[],
  stack: readonly ValueId[],
  len: number,
  start: number,
): boolean => {
  for (let i = 0; i < len; ++i)
    if (inputs[i] != stack[start + i])
      return false;
  return true;
}

export {
  APPLY_COST,
  hScore,
  starDistance,
};
