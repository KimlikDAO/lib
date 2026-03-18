import { Curve, Point } from "../../ellipticCurve";
import { weierstrassCurve } from "../../weierstrassCurve";

/** @noinline */
const P = (1n << 256n) - (1n << 32n) - 977n;
/** @noinline */
const Q: bigint = P - 0x14551231950b75fc4402da1722fc9baeen;

const Secp256k1: Curve = weierstrassCurve(P, 0n, 7n);

/** @noinline */
const G: Point = Secp256k1.pointFromAffine({
  x: 0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798n,
  y: 0x483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8n
});

export { G, P, Q, Secp256k1 };
