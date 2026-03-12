/**
 * Modular inversion over 𝔽ₚ via the Euclidean algorithm.
 *
 * Requires that b < P and P is a prime. Returns x such that bx + Py = 1 and
 * 0 < x < P.
 * @pure
 */
const inverse = (b: bigint, P: bigint): bigint => {
  let a = P;
  let x = 0n;
  let y = 1n;
  let t: bigint;
  let q: bigint;
  while (b != 0n) {
    q = a / b;
    t = y; y = x - q * y; x = t;
    t = b; b = a - q * b; a = t;
  }
  if (x < 0n) x += P;
  return x;
}

/**
 * Computes aˣ (mod M) and outputs the smallest positive representation.
 * The function is not constant time and should not be used in cases where
 * side-channel attacks are possible.
 * @pure
 */
const exp = (a: bigint, x: bigint, M: bigint): bigint => {
  const xBits = x.toString(2);
  if (xBits.charCodeAt(0) == 48) return 1n;
  a %= M;
  let r = a;
  for (let i = 1; i < xBits.length; ++i) {
    r = r * r % M;
    if (xBits.charCodeAt(i) == 49) r = r * a % M;
  }
  return r;
}

/** @pure */
const pow5 = (b: bigint, M: bigint): bigint => {
  const t = b * b % M;
  return b * t * t % M;
}

/** @pure */
const pow7 = (b: bigint, M: bigint): bigint => {
  const t = b * b * b % M;
  return t * t * b % M;
}

/**
 * Calculates 2^x (mod M).
 *
 * Provides a modest 5% speedup over the `exp(2, x, M)`. May be deprecated
 * later since the speedup is miniscule.
 * @pure
 */
const exp2 = (x: bigint, M: bigint): bigint => {
  const xDigits = x.toString(16);
  let r = BigInt(1 << parseInt(xDigits[0], 16)) % M;
  for (let i = 1; i < xDigits.length; ++i) {
    r = r * r % M;
    r = r * r % M;
    r = r * r % M;
    r = ((r * r) << BigInt("0x" + xDigits[i])) % M;
  }
  return r;
}

/** @pure */
const expTimesExp = (
  a: bigint,
  x: bigint,
  b: bigint,
  y: bigint,
  M: bigint
): bigint => {
  let xBits = x.toString(2);
  let yBits = y.toString(2);
  if (xBits.length > yBits.length)
    yBits = yBits.padStart(xBits.length, "0");
  else
    xBits = xBits.padStart(yBits.length, "0");
  const d: readonly bigint[] = [1n, a, b, a * b % M];
  let r = d[(xBits.charCodeAt(0) - 48) + 2 * (yBits.charCodeAt(0) - 48)];
  for (let i = 1; i < xBits.length; ++i) {
    r = r * r % M;
    r = r * d[(xBits.charCodeAt(i) - 48) + 2 * (yBits.charCodeAt(i) - 48)] % M;
  }
  return r;
}

/**
 * Tonelli-Shanks square root algorithm.
 * @see https://en.wikipedia.org/wiki/Tonelli–Shanks_algorithm
 *
 * @param n
 * @param P the modulus
 * @param Q the odd factor of P-1 satisfying Q.2^M = P-1
 * @param c z^Q where z is a quadratic non-residue
 * @param M so that Q.2^M == P-1
 * @return sqrt(n) if n is a quadratic residue, null otherwise
 * @pure
 */
const tonelliShanks = (
  n: bigint,
  P: bigint,
  Q: bigint,
  c: bigint,
  M: bigint
): bigint | null => {
  if (n == 0n) return 0n;
  let t = exp(n, Q >> 1n, P);
  let R = t * n % P;
  for (t = t * R % P; t != 1n; t = t * c % P) {
    let i = 0n;
    for (let tt = t; tt != 1n; ++i)
      tt = tt * tt % P;
    if (i == M) return null; // n is not a quadratic residue
    let b = exp(c, 1n << (M - i - 1n), P);
    M = i;
    c = b * b % P;
    R *= b; R %= P;
  }
  return R;
}

/**
 * If P is fixed, prefer the {@link tonelliShanks()} function with precomputed
 * values of M, Q and c.
 * @pure
 */
const sqrt = (n: bigint, P: bigint): bigint | null => {
  let Q = P >> 1n;
  if ((Q & 1n) == 1n)
    return exp(n, (Q >> 1n) + 1n, P);
  let M = 2n;
  for (Q >>= 1n; (Q & 1n) == 0n; Q >>= 1n) ++M;
  let z = 2n;
  while (exp(z, P >> 1n, P) == 1n) ++z;
  return tonelliShanks(n, P, Q, exp(z, Q, P), M);
}

export {
  exp, exp2, expTimesExp,
  inverse,
  pow5, pow7,
  sqrt,
  tonelliShanks
};
