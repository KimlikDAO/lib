import { expect, test } from "bun:test";
import { G, recoverSigner, sign, verify } from "../../secp256k1";

test("valid signatures are verified", () => {
  for (let z = 1n; z <= 100n; ++z) {
    const { r, s, yParity } = sign(z, 10n);
    const A = recoverSigner(z, r, s, yParity);
    expect(A).toEqual(G.copy().multiply(10n).proj());
  }
  for (let pk = 1n; pk <= 100n; ++pk) {
    const { r, s, yParity } = sign(101n, pk);
    const A = recoverSigner(101n, r, s, yParity);
    expect(A).toEqual(G.copy().multiply(pk).proj());
  }
  for (let i = 1n; i <= 100n; ++i) {
    const pk = i + 12938719237810238978787234n;
    const { r, s, yParity } = sign(808n, pk);
    const A = recoverSigner(808n, r, s, yParity);
    expect(A).toEqual(G.copy().multiply(pk).proj());
  }
});

test("invalid signatures are rejected", () => {
  for (let z = 1n; z <= 100n; ++z) {
    const { r, s } = sign(z, 11n);
    expect(verify(z, r, s, G.copy().multiply(10n).proj()))
      .toBeFalse();
  }
  for (let pk = 1n; pk <= 100n; ++pk) {
    const { r, s, yParity } = sign(101n, pk);
    const A = recoverSigner(101n, r, s, !yParity);
    expect(A).not.toEqual(G.copy().multiply(pk).proj());
  }
  for (let i = 1n; i <= 100n; ++i) {
    const pk = i + 12938719237810238978787234n;
    const { r, s, yParity } = sign(808n, pk);
    const A = recoverSigner(808n, s, r, yParity);
    expect(A).not.toEqual(G.copy().multiply(pk).proj());
  }
});
