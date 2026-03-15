import { bench } from "../../util/testing/bench";
import { poseidon } from "../minaPoseidon";
import { mont, mul, P, unmont } from "../montgomery";

const arr: bigint[] = new Array(2000);
arr[0] = 1337n;
arr[1] = 3169n;
for (let i = 2; i < 2000; ++i)
  arr[i] = poseidon([arr[i - 1], BigInt(i)]);

const montintMul = (): bigint => {
  let acc = mont(1n);
  for (let i = 1; i < 2000; ++i)
    acc = mul(acc, mont(arr[i]));
  return unmont(acc);
};

const bigintMul = (): bigint => {
  let acc = 1n;
  for (let i = 1; i < 2000; ++i)
    acc = acc * arr[i] % P;
  return acc;
};

bench("Montgomery mul vs bigint mul (2000-chain)", {
  "montintMul": () => montintMul(),
  "bigintMul": () => bigintMul(),
}, {
  repeat: 100,
  dataset: [{
    args: [],
    expected: 0x13dfc7db048bc93eea32afc4dd4d265317c86a81075c6282e46d8a65df912100n
  }],
});
