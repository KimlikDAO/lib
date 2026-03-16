import { CompressedPoint, Curve, Point } from "../../ellipticCurve";
import { sqrt } from "../../modular";
import { weierstrassCurve } from "../../weierstrassCurve";

/** @noinline */
const P = (1n << 192n) - (1n << 96n) - 1n;
/** @noinline */
const b = 0x64210519E59C80E70FA7E9AB72243049FEB8DEECC146B9B1n;
/** @noinline */
const Q = P + 0x99def836146bc9b1b4d22832n;

const Secp192r1: Curve = Object.assign(weierstrassCurve(P, -3n), {
  /** @pure */
  pointFrom({ x, yParity }: CompressedPoint): Point | null {
    const y2 = (x * (x * x - 3n) + b + P) % P; // y² = x³ - 3x + b, hence y² = x(x² - 3) + b
    const y = sqrt(y2, P);
    if (y == null) return null;
    return new Secp192r1(x, (y & 1n) == (yParity as unknown as bigint) ? y : P - y, 1n);
  }
}) as Curve;

const G: Point = Secp192r1.pointFromAffine({
  x: 0x188DA80EB03090F67CBF20EB43A18800F4FF0AFD82FF1012n,
  y: 0x07192B95FFC8DA78631011ED6B24CDD573F977A11E794811n,
});

export { G, P, Q, Secp192r1 };
