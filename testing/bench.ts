import { shuffle } from "../util/arrays";
import { assertEq, assertIs } from "./assert";

const compareImpls = <A, T>(
  fs: ((...args: A[]) => T)[],
  repeat: number,
  args: A[],
  expected: T
): void => {
  for (const f of fs) {
    console.time(f["name"]);
    for (let i = 0; i < repeat; ++i)
      assertIs(f(...args), expected);
    console.timeEnd(f["name"]);
  }
}

const compareImplsArray = <A, T>(
  fs: ((...args: A[]) => T)[],
  repeat: number,
  args: A[],
  expected: T
): void => {
  for (const f of fs) {
    console.time(f["name"]);
    for (let i = 0; i < repeat; ++i)
      assertEq(f(...args), expected);
    console.timeEnd(f["name"]);
  }
}

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
    const shuffled = shuffle(names);
    for (const name of shuffled) {
      const fn = fns[name];
      const t0 = performance.now();
      for (let i = 0; i < options.repeat; ++i)
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

export { bench, compareImpls, compareImplsArray };
