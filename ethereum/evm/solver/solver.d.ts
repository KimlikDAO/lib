/**
 * Integer identifier for a value that may appear on the abstract solver stack.
 *
 * The stack top is the rightmost element of a {@link StackState}.
 *
 * Value ids have three domains:
 * - `0` is a blank stack slot / hole. It can be created with `BLANK_ACTION`
 *   and can satisfy rule inputs that explicitly require `0`.
 * - Negative values are unique references to values already present in the
 *   initial EVM stack. These are green from the start.
 * - Positive values name emitted leaves or rule outputs. Once a positive value
 *   is on the stack, its whole dependency subtree is considered green.
 */
type ValueId = number;

/**
 * Integer identifier for an operation the solver may append to a path.
 *
 * Positive action ids coincide with the positive {@link ValueId} they produce:
 * action `n` either emits terminal value `n`, or applies `rules[n] -> n` when
 * `rules[n]` is defined and the current stack ends with those inputs.
 *
 * Nonpositive action ids are reserved for primitive stack actions declared in
 * `action.ts`: blank, pop, swap, and dup.
 */
type ActionId = number;

/**
 * Abstract stack snapshot used by the solver.
 *
 * The top of stack is at the end of the array. Solver transitions should treat
 * stack states as immutable values and create a new array for each successor.
 */
type StackState = ValueId[];

/**
 * Ordered prerequisites for applying a positive rule action.
 *
 * For a rule `rules[n] = [a, b, c]`, action `n` is legal only when the current
 * stack ends in `[a, b, c]`; it then removes that suffix and pushes `n`.
 */
type RuleInputs = ValueId[];

/**
 * Complete input to the integer stack problem.
 */
interface Problem {
  /**
   * Initial abstract stack.
   *
   * Nonzero initial values must be consecutive negative ids, possibly separated
   * by zeros, e.g. `[-3, 0, -2, -1]`. These negative ids represent values that
   * are already available on the EVM stack.
   */
  readonly init: StackState;

  /**
   * Initial stack references that must still be present in the final stack.
   *
   * Entries should be negative ids from {@link init}. The solver may pop or
   * move other initial references when doing so is cheaper.
   */
  readonly keep: ValueId[];

  /**
   * Positive value the solver must build.
   *
   * A solution is accepted when the final stack ends with this value and every
   * kept value is still present somewhere in the stack.
   */
  readonly output: ValueId;

  /**
   * Rule table indexed by positive output value.
   *
   * `rules[n]` gives the ordered inputs for action `n`. Missing entries are
   * interpreted as terminal positive leaves that can be emitted directly by
   * action `n`. `rules[0]` is a placeholder and should be `[]`.
   */
  readonly rules: RuleInputs[];
}

/**
 * Path returned by a solver.
 *
 * Applying {@link actions} from {@link beg} must produce {@link end}. The final
 * stack should end in the problem output and preserve every requested kept
 * initial value.
 */
interface Path {
  /** Stack before the first action, normally equal to `problem.init`. */
  readonly beg: StackState;

  /** Ordered actions to execute from {@link beg}. */
  readonly actions: ActionId[];

  /** Stack obtained after applying every action. */
  readonly end: StackState;
}

type Solution = Path;

export {
  ActionId,
  Path,
  Problem,
  RuleInputs,
  Solution,
  StackState,
  ValueId,
};
