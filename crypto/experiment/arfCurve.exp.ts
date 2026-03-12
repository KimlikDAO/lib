import { exp, inverse, sqrt } from "../modular";

/**
 * 1) Δ(p, q) = Δ(q, p)
 * 2) Δ(p, q) ≥ -4min(p,q)
 *
 * These hold by definition of Δ.
 * If q is the size of an ellitic curve over F_p, then Hasse's
 * result is equivalent to the assertion
 *
 * 3) Δ(p, q) ≤ 0
 *
 * Further, if the elliptic curve is an Arf Curve, then
 *
 * 4) Δ(p, q) = -3u² for some integer u.
 */
const Δ = (p: bigint, q: bigint): bigint => {
  const t = p + 1n - q;
  return t * t - 4n * p;
}

/**
 * Calculates the integer square root of a BigInt.
 * This function returns the largest integer r such that r * r <= n.
 */
const greatestRootOfSquare = (n: bigint): bigint => {
  let x = n;
  let y = (x + 1n) >> 1n;

  while (y < x) {
    x = y;
    y = (x + n / x) >> 1n;
  }
  return x;
};

const printClasses = (R: bigint): void => {
  const Colors = 30;
  const color: bigint[] = Array(Colors);
  color[1] = 1n;
  for (let b = 2; b <= Colors; ++b) {
    const ib = inverse(BigInt(b), R);
    for (let a = 1; a < b; ++a) {
      const f = BigInt(a) * ib % R;
      const fp1_3 = exp(f, (R - 1n) / 3n, R);
      const u3 = sqrt(f, R)
      if (u3 && (u3 * u3 % R == f) && fp1_3 == 1n) {
        color[b] = color[a];
        break;
      }
    }
    color[b] ||= BigInt(b);
  }
  console.log(color);
}
printClasses(0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2fn);

export {
  greatestRootOfSquare,
  printClasses,
  Δ
};
