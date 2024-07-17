/**
 * A preliminary Pallas-Vesta implementation.
 *
 * @author KimlikDAO
 */

/** @const {!bigint} */
const P = (1n << 254n) + 0x224698fc094cf91b992d30ed00000001n;

/** @const {!bigint} */
const Q = P + 0x47afc1f319ba34n;

const PallasPoint = arfCurve(P);
const VestaPoint = arfCurve(Q);
