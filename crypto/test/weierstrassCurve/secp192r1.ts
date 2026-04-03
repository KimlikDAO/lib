import { LargeConstant } from "@kimlikdao/kdts";
import { Curve, Point } from "../../ellipticCurve";
import { weierstrassCurve } from "../../weierstrassCurve";

const P = (1n << 192n) - (1n << 64n) - 1n satisfies LargeConstant;
const b = 0x64210519E59C80E70FA7E9AB72243049FEB8DEECC146B9B1n satisfies LargeConstant;
const Q: bigint = P - 0x662107c8eb94364e4b2dd7cen satisfies LargeConstant;

const Secp192r1: Curve = weierstrassCurve(P, -3n, b);

const G: Point = Secp192r1.pointFromAffine({
  x: 0x188da80eb03090f67cbf20eb43a18800f4ff0afd82ff1012n,
  y: 0x07192b95ffc8da78631011ed6b24cdd573f977a11e794811n,
}) satisfies LargeConstant;

export { G, P, Q, Secp192r1 };
