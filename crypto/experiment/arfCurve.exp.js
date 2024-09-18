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
 *
 * @param {bigint} p
 * @param {bigint} q
 * @return {bigint}
 */
const Δ = (p, q) => {
  const t = p + 1n - q;
  return t * t - 4n * p;
}

/**
 * Calculates the integer square root of a BigInt.
 * This function returns the largest integer r such that r * r <= n.
 *
 * @param {bigint} n - The number to find the square root of
 * @return {bigint} The integer square root of n
 */
const greatestRootOfSquare = (n) => {
  let x = n;
  let y = (x + 1n) >> 1n;

  while (y < x) {
    x = y;
    y = (x + n / x) >> 1n;
  }
  return x;
};

const printClasses = (R) => {
  const color = Array(30);
  color[1n] = 1n;
  for (let b = 2n; b <= 30; ++b) {
    const ib = inverse(b, R);
    for (let a = 1n; a < b; ++a) {
      const f = a * ib % R;
      const fp1_3 = exp(f, (R - 1n) / 3n, R);
      const u3 = sqrt(f, R)
      if (u3 && (u3 * u3 % R == f) && fp1_3 == 1n) {
        color[b] = color[a];
        break;
      }
    }
    color[b] ||= b;
  }
  console.log(color);
}
printClasses(R);

export {
  greatestRootOfSquare,
  printClasses,
  Δ
};
