import { Curve, Point } from "../../ellipticCurve";
import { weierstrassCurve } from "../../weierstrassCurve";

/** @noinline */
const P = (1n << 192n) - (1n << 96n) - 1n;
/** @noinline */
const b = 0x64210519E59C80E70FA7E9AB72243049FEB8DEECC146B9B1n;
/** @noinline */
const Q: bigint = P + 0x99def836146bc9b1b4d22832n;

const Secp192r1: Curve = weierstrassCurve(P, -3n, b);

const G: Point = Secp192r1.pointFromAffine({
  x: 0x188DA80EB03090F67CBF20EB43A18800F4FF0AFD82FF1012n,
  y: 0x07192B95FFC8DA78631011ED6B24CDD573F977A11E794811n,
});

export { G, P, Q, Secp192r1 };
