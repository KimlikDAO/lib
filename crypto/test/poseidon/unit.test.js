import { expect, test } from "bun:test";
import { P, poseidon } from "../../poseidon";

test("agrees to mina-poseidon on select values", () => {
  expect(P).toBe(0x40000000000000000000000000000000224698fc094cf91b992d30ed00000001n);

  expect(poseidon([1n])).toBe(0x10b41a5d3139ef0802e5faf6a7776aab079e44e99ec5b306ddddd88e15fe9e6dn);
  expect(poseidon([1n, 2n, 3n])).toBe(0x366e46102b0976735ed1cc8820c7305822a448893fee8ceeb42a3012a4663fd0n);
  expect(poseidon([1n, 2n, 3n, 4n])).toBe(0x27cb98f251ab99b29c08e8509772dff6e6f9454293d55941b84f09a9c2f2169an);
  expect(poseidon([1n, 2n, 3n, 4n, 5n])).toBe(0x27cc8fc2d8052df2f44fee2d74ea01aa33195d263b99128f78f24ae0b420d7ecn);
  expect(poseidon([123123123n])).toBe(0xc2a3f435a718a6653343c3d6d0bde00e8278ed981cb0d2f16868f621032623an);
});
