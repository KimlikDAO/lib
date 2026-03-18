import bigints from "../../util/bigints";
import { bench } from "../../util/testing/bench";
import { G as GArf } from "../secp256k1";
import { G as GWts } from "../test/weierstrassCurve/secp256k1";

const k = bigints.random(32);

const arf = (k: bigint): bigint => {
  let scalar = k;
  for (let i = 0; i < 100; ++i)
    scalar = GArf.copy().multiply(scalar).proj().x;
  return scalar;
};

const weierstrass = (k: bigint): bigint => {
  let scalar = k;
  for (let i = 0; i < 100; ++i)
    scalar = GWts.copy().multiply(scalar).proj().x;
  return scalar;
};

bench("secp256k1 multiply ×100 (input ← P.proj().x)", {
  "arf": arf,
  "weierstrass": weierstrass,
}, {
  repeat: 10,
  dataset: [{ args: [k], expected: arf(k) }],
});
