import { compareImpls } from "../../testing/bench";
import { f, g } from "../sha2";

const f1 = () => {
  const a = new Uint32Array(8);
  for (let i = 0; i < 63; ++i) {
    a.set(a.subarray(1));
    a[5] += 123;
    a[7] = 1;
  }
  return a[0]
}

const f2 = () => {
  let a0 = 0, a1 = 0, a2 = 0, a3 = 0;
  let a4 = 0, a5 = 0, a6 = 0, a7 = 0;

  for (let i = 0; i < 63; ++i) {
    a0 = a1;
    a1 = a2;
    a2 = a3;
    a3 = a4;
    a4 = a5;
    a5 = a6 + 123 << 0;
    a6 = a7;
    a7 = 1;
  }
  return a0;
}

compareImpls([f1, f2], 100, [], 124);

const g1 = () => {
  const a = Uint32Array.from("01234567890123456789");
  const b = new Uint32Array(a.length);

  for (let i = 0; i < 100; ++i)
    for (let j = 0; j < a.length; ++j)
      b[j] = a[j];
  return b[9];
}

const g2 = () => {
  const a = Uint32Array.from("01234567890123456789");
  const b = new Uint32Array(a.length);

  for (let i = 0; i < 100; ++i)
    b.set(a);
  return b[9]
}

g1();

compareImpls([g1, g2], 100, [], 9);

const s = Uint32Array.from("01234567");
const t = new Uint32Array(64);

compareImpls([
  () => {
    const ss = new Uint32Array(s);
    const tt = new Uint32Array(t);
    f(ss, tt);
  },
  () => {
    const ss = new Uint32Array(s);
    const tt = new Uint32Array(t);
    g(ss, tt);
  }],
  1000, [], null
);
