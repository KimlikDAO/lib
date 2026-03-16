import { shuffle } from "../arrays";
import { assertEq } from "./assert";

const bench = <A, T>(
  description: string,
  fns: Record<string, (...args: A[]) => T>,
  options: { repeat: number, dataset: { args: A[], expected: T }[] },
): void => {
  const names = Object.keys(fns);
  const times: Record<string, number> = {};
  for (const name of names) times[name] = 0;
  for (const data of options.dataset) {
    const { args, expected } = data;
    shuffle(names);
    for (const name of names) {
      const fn = fns[name];
      const t0 = performance.now();
      for (let i = 0, r = options.repeat; i < r; ++i)
        assertEq(fn(...args), expected);
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
    console.log(`  ${name.padEnd(maxNameLen)}  ${times[name].toFixed(2)} ms${slower}`);
  }
}

export { bench };
