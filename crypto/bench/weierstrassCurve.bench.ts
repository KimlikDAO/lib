import { bench } from "@kimlikdao/kdts/bench";
import bigints from "../../util/bigints";
import { G as G_arf } from "../secp256k1";
import { G as G_wei } from "../test/weierstrassCurve/secp256k1";

const k = bigints.random(256);

const arf = (k: bigint): bigint => {
  let scalar = k;
  for (let i = 0; i < 100; ++i)
    scalar = G_arf.copy().multiply(scalar).proj().x;
  return scalar;
};

const weierstrass = (k: bigint): bigint => {
  let scalar = k;
  for (let i = 0; i < 100; ++i)
    scalar = G_wei.copy().multiply(scalar).proj().x;
  return scalar;
};

bench("secp256k1 multiply ×100 (input ← P.proj().x)", {
  "arf": arf,
  "weierstrass": weierstrass,
}, {
  repeat: 10,
  dataset: [{ input: k, output: arf(k) }],
});
