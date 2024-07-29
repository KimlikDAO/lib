import { expect, test } from "bun:test";
import { P, poseidon } from "../minaPoseidon63";

test("agrees with mina 'poseidonLegacy' on select values", () => {
  expect(P).toBe(0x40000000000000000000000000000000224698fc094cf91b992d30ed00000001n);

  expect(poseidon([1n])).toBe(0x3c18a0745169a7331c4daf3c1a5456eab435f8513f3d232134999a1fd9894354n);
  expect(poseidon([1n, 1n])).toBe(0x2d74072792f1f4983e66265467a83046a08f40a1e3c6d4fb279fcb5ca0f5aba7n);
  expect(poseidon([1n, 1n, 31n])).toBe(0x3f2f76114a17c975860c3bf39e6f08a4db70528d365ae35430605bc63c9cbfb8n);
});
