import { describe, expect, test } from "bun:test";
import { CompressedPoint, Curve, Point, compressPoint } from "../ellipticCurve";
import { sqrt } from "../modular";
import { weierstrassCurve } from "../weierstrassCurve";

/** secp192r1 / NIST P-192 parameters */
const P = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFFFFFFFFFFFFn;
const a = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFFFFFFFFFFFCn;
const b = 0x64210519E59C80E70FA7E9AB72243049FEB8DEECC146B9B1n;
const Q = 0xFFFFFFFFFFFFFFFFFFFFFFFF99DEF836146BC9B1B4D22831n;

const modP = (x: bigint): bigint => {
  let t = x % P;
  return t >= 0n ? t : t + P;
};

const Secp192r1: Curve = Object.assign(weierstrassCurve(P, a), {
  /** @pure */
  pointFrom({ x, yParity }: CompressedPoint): Point | null {
    const y2 = modP(x * x * x + a * x + b);
    const y = sqrt(y2, P);
    if (y == null) return null;
    return new Secp192r1(x, !!(y & 1n) == yParity ? y : P - y, 1n);
  }
}) as Curve;

const G = Secp192r1.pointFromAffine({
  x: 0x188DA80EB03090F67CBF20EB43A18800F4FF0AFD82FF1012n,
  y: 0x07192B95FFC8DA78631011ED6B24CDD573F977A11E794811n,
});

describe("weierstrassCurve (secp192r1)", () => {
  test("pointFrom decodes compressed generator", () => {
    const c = compressPoint(G.proj());
    const R = Secp192r1.pointFrom(c);
    expect(R).not.toBeNull();
    expect(R!.proj()).toEqual(G.proj());
  });

  test("generator satisfies curve equation", () => {
    const { x, y } = G.proj();
    expect(modP(y * y)).toBe(modP(x * x * x + a * x + b));
  });

  test("group order check: N*G = O and (N+1)*G = G", () => {
    expect(G.copy().multiply(Q).proj()).toEqual({ x: 0n, y: 0n });
    expect(G.copy().multiply(Q + 1n).proj()).toEqual(G.proj());
  });
});
