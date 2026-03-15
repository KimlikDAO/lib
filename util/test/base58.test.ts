import { expect, test } from "bun:test";
import base58 from "../base58";
import hex from "../hex";

test("base58 ↔ hex vectors", () => {
  expect(base58.from(hex.toUint8Array(""))).toBe("");
  expect(base58.toBytes("")).toEqual(hex.toUint8Array(""));

  expect(base58.from(hex.toUint8Array("61"))).toBe("2g");
  expect(base58.toBytes("2g")).toEqual(hex.toUint8Array("61"));

  expect(base58.from(hex.toUint8Array("626262"))).toBe("a3gV");
  expect(base58.toBytes("a3gV")).toEqual(hex.toUint8Array("626262"));

  expect(base58.from(hex.toUint8Array("636363"))).toBe("aPEr");
  expect(base58.toBytes("aPEr")).toEqual(hex.toUint8Array("636363"));

  expect(
    base58.from(
      hex.toUint8Array("73696d706c792061206c6f6e6720737472696e67"),
    ),
  ).toBe("2cFupjhnEsSn59qHXstmK2ffpLv2");
  expect(base58.toBytes("2cFupjhnEsSn59qHXstmK2ffpLv2")).toEqual(
    hex.toUint8Array("73696d706c792061206c6f6e6720737472696e67"),
  );

  expect(
    base58.from(
      hex.toUint8Array(
        "00eb15231dfceb60925886b67d065299925915aeb172c06647",
      ),
    ),
  ).toBe("1NS17iag9jJgTHD1VXjvLCEnZuQ3rJDE9L");
  expect(base58.toBytes("1NS17iag9jJgTHD1VXjvLCEnZuQ3rJDE9L")).toEqual(
    hex.toUint8Array("00eb15231dfceb60925886b67d065299925915aeb172c06647"),
  );

  expect(base58.from(hex.toUint8Array("516b6fcd0f"))).toBe("ABnLTmg");
  expect(base58.toBytes("ABnLTmg")).toEqual(hex.toUint8Array("516b6fcd0f"));

  expect(base58.from(hex.toUint8Array("bf4f89001e670274dd"))).toBe(
    "3SEo3LWLoPntC",
  );
  expect(base58.toBytes("3SEo3LWLoPntC")).toEqual(
    hex.toUint8Array("bf4f89001e670274dd"),
  );

  expect(base58.from(hex.toUint8Array("572e4794"))).toBe("3EFU7m");
  expect(base58.toBytes("3EFU7m")).toEqual(hex.toUint8Array("572e4794"));

  expect(base58.from(hex.toUint8Array("ecac89cad93923c02321"))).toBe(
    "EJDM8drfXA6uyA",
  );
  expect(base58.toBytes("EJDM8drfXA6uyA")).toEqual(
    hex.toUint8Array("ecac89cad93923c02321"),
  );

  expect(base58.from(hex.toUint8Array("10c8511e"))).toBe("Rt5zm");
  expect(base58.toBytes("Rt5zm")).toEqual(hex.toUint8Array("10c8511e"));

  expect(base58.from(hex.toUint8Array("00000000000000000000"))).toBe(
    "1111111111",
  );
  expect(base58.toBytes("1111111111")).toEqual(
    hex.toUint8Array("00000000000000000000"),
  );

  /** @noinline */
  const shortHex =
    "000111d38e5fc9071ffcd20b4a763cc9ae4f252bb4e48fd66a835e252ada93ff480d6dd43dc62a641155a5";
  /** @noinline */
  const charsetB58 =
    "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  expect(base58.from(hex.toUint8Array(shortHex))).toBe(charsetB58);
  expect(base58.toBytes(charsetB58)).toEqual(hex.toUint8Array(shortHex));

  /** @noinline */
  const allBytesHex =
    "000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f202122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f404142434445464748494a4b4c4d4e4f505152535455565758595a5b5c5d5e5f606162636465666768696a6b6c6d6e6f707172737475767778797a7b7c7d7e7f808182838485868788898a8b8c8d8e8f909192939495969798999a9b9c9d9e9fa0a1a2a3a4a5a6a7a8a9aaabacadaeafb0b1b2b3b4b5b6b7b8b9babbbcbdbebfc0c1c2c3c4c5c6c7c8c9cacbcccdcecfd0d1d2d3d4d5d6d7d8d9dadbdcdddedfe0e1e2e3e4e5e6e7e8e9eaebecedeeeff0f1f2f3f4f5f6f7f8f9fafbfcfdfeff";
  /** @noinline */
  const longB58 =
    "1cWB5HCBdLjAuqGGReWE3R3CguuwSjw6RHn39s2yuDRTS5NsBgNiFpWgAnEx6VQi8csexkgYw3mdYrMHr8x9i7aEwP8kZ7vccXWqKDvGv3u1GxFKPuAkn8JCPPGDMf3vMMnbzm6Nh9zh1gcNsMvH3ZNLmP5fSG6DGbbi2tuwMWPthr4boWwCxf7ewSgNQeacyozhKDDQQ1qL5fQFUW52QKUZDZ5fw3KXNQJMcNTcaB723LchjeKun7MuGW5qyCBZYzA1KjofN1gYBV3NqyhQJ3Ns746GNuf9N2pQPmHz4xpnSrrfCvy6TVVz5d4PdrjeshsWQwpZsZGzvbdAdN8MKV5QsBDY";
  expect(base58.from(hex.toUint8Array(allBytesHex))).toBe(longB58);
  expect(base58.toBytes(longB58)).toEqual(hex.toUint8Array(allBytesHex));
});
