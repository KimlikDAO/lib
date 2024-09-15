import { compareImpls } from "../../testing/bench";
import { poseidon } from "../minaPoseidon";
import { mont, mul, P, unmont } from "../montgomery";

/** @const {Array<bigint>} */
const arr = new Array(2000);
arr[0] = 1337n;
arr[1] = 3169n;
for (let i = 2; i < 2000; ++i)
  arr[i] = poseidon([arr[i - 1], BigInt(i)]);

const montintMul = () => {
  let acc = mont(1n);
  for (let i = 1; i < 2000; ++i)
    acc = mul(acc, mont(arr[i]));
  return unmont(acc);
}

const bigintMul = () => {
  let acc = 1n;
  for (let i = 1; i < 2000; ++i)
    acc = acc * arr[i] % P;
  return acc;
}

compareImpls([
  montintMul,
  bigintMul
], 1, [],
  0x13dfc7db048bc93eea32afc4dd4d265317c86a81075c6282e46d8a65df912100n
);
