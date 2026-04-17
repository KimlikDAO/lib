import { shuffle } from "./util/arrays";
import { assertEq } from "./util/assert";

/**
 * Runs a correctness-checked benchmark for alternative implementations of
 * the same operation.
 *
 * Each function is executed `repeat` times for every dataset item and its
 * result is compared against the expected output with `assertEq`.
 * Implementations are shuffled for each input to reduce order bias, then
 * reported from fastest to slowest together with their slowdown relative to
 * the fastest one.
 *
 * @example
 * ```ts
 * bench("sum", {
 *   loop: sumLoop,
 *   reduce: sumReduce,
 * }, {
 *   repeat: 10_000,
 *   dataset: [
 *     { input: [1, 2, 3], output: 6 },
 *     { input: [5, 8], output: 13 },
 *   ],
 * });
 * ```
 */
const bench = <I, O>(
  description: string,
  fns: Record<string, (input: I) => O>,
  options: { repeat: number, dataset: { input: I, output: O }[] },
): void => {
  const names = Object.keys(fns);
  const times: Record<string, number> = {};
  for (const name of names) times[name] = 0;
  for (const data of options.dataset) {
    const { input, output } = data;
    shuffle(names);
    for (const name of names) {
      const fn = fns[name];
      const t0 = performance.now();
      for (let i = 0, r = options.repeat; i < r; ++i)
        assertEq(fn(input), output);
      times[name] += performance.now() - t0;
    }
  }
  names.sort((a, b) => times[a] - times[b]);
  const maxNameLen = names.reduce((max, n) => Math.max(max, n.length), 0);
  const fastest = times[names[0]];
  console.log(description);
  for (const name of names) {
    const pct = fastest == 0 ? 0 : (times[name] / fastest - 1) * 100;
    const slower = name == names[0]
      ? "      (fastest)"
      : `  ${pct.toFixed(1).padStart(5)}% slower`;
    console.log(
      `  ${name.padEnd(maxNameLen)}  ${times[name].toFixed(2)} ms${slower}`
    );
  }
}

export { bench };
