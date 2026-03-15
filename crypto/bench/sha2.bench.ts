import { bench } from "../../util/testing/bench";
import { g as unroll1 } from "../sha2";
import { f as unroll4 } from "../test/sha2/compression";

const s = Uint32Array.from("01234567");
const t = new Uint32Array(64);

bench("SHA256 compression: 4-round unroll vs 1-round (single block).", {
  "unroll4": () => {
    const ss = new Uint32Array(s);
    const tt = new Uint32Array(t);
    unroll4(ss, tt);
    return ss[0];
  },
  "unroll1": () => {
    const ss = new Uint32Array(s);
    const tt = new Uint32Array(t);
    unroll1(ss, tt);
    return ss[0];
  },
}, {
  repeat: 1000,
  dataset: [{ args: [], expected: 588650447 }],
});

bench("Simulated state shift: Uint32Array.set(subarray) vs scalar variables (63 iterations).", {
  "Uint32Array.set": () => {
    const a = new Uint32Array(8);
    let acc = 0;
    for (let i = 0; i < 10; ++i) {
      for (let i = 0; i < 63; ++i) {
        a.set(a.subarray(1));
        a[5] = (a[5] + 123) << 0;
        a[7] = 1;
      }
      acc += a[0];
    }
    return acc;
  },
  "scalar vars": () => {
    let acc = 0;
    for (let i = 0; i < 10; ++i) {
      let a0 = 0, a1 = 0, a2 = 0, a3 = 0;
      let a4 = 0, a5 = 0, a6 = 0, a7 = 0;
      for (let i = 0; i < 63; ++i) {
        a0 = a1;
        a1 = a2;
        a2 = a3;
        a3 = a4;
        a4 = a5;
        a5 = (a6 + 123) << 0;
        a6 = a7;
        a7 = 1;
      }
      acc += a0;
    }
    return acc;
  },
}, {
  repeat: 100,
  dataset: [{ args: [] as never[], expected: 1240 }],
});

bench("Copy 20 words × 100 iters: element loop vs .set().", {
  "element loop": () => {
    const a = Uint32Array.from("01234567890123456789");
    const b = new Uint32Array(a.length);
    for (let i = 0; i < 100; ++i)
      for (let j = 0; j < a.length; ++j)
        b[j] = a[j];
    return b[9];
  },
  "b.set(a)": () => {
    const a = Uint32Array.from("01234567890123456789");
    const b = new Uint32Array(a.length);
    for (let i = 0; i < 100; ++i)
      b.set(a);
    return b[9];
  },
}, {
  repeat: 100,
  dataset: [{ args: [], expected: 9 }],
});
