import { describe, expect, it, test } from "bun:test";
import hex from "../../../util/hex";
import {
  keccak256,
  keccak256Uint32,
  keccak256Uint32ToHex,
  keccak256Uint8
} from "../../sha3";

describe("`keccak256()` tests", () => {
  it("should output correct string value", () => {
    expect(keccak256("a"))
      .toBe("3ac225168df54212a25c1c01fd35bebfea408fdac2e31ddd6f80a4bbf9a5f1cb");
    expect(keccak256("KimlikDAO"))
      .toBe("27f13dbab0f15a910e07f535a5e00d7fa9aeecc05edf81fc9191b482f5b8f07b");
    expect(keccak256("DAOKasasiV1"))
      .toBe("3f5e44c15812e7a9bd6973fd9e7c7da4afea4649390f7a1652d5b56caa8afeff");
    expect(keccak256("DAOKasasiV2"))
      .toBe("2d7821c610b81500eb7161a82514071bd27c2ea4bcd376b4e2641a3478f8227c");
    expect(keccak256("OylamaV1"))
      .toBe("2ebcd3dad633011bca307c5ca6ad84a8fac491a68c8a3104470dc58a85c91f53");
    expect(keccak256("OylamaV2"))
      .toBe("4290d6a1b6d740f23ccc384ba6018214b01666264bfbfbb57554a50d102a063f");
    expect(keccak256("Deneme"))
      .toBe("62592aae22a4f32153836d2a5dccaf6995695fc0a15301b8b306d46aeb316f32");
    expect(keccak256(""))
      .toBe("c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470");
    expect(keccak256("3ac225168df54212a25c1c01fd35bebfea408fdac2e31ddd6f80a4bbf9a5f1cb".repeat(10)))
      .toBe("1d22484fbe32dff99e456dbca27b22db2c4c7d006cbc1addc58e08903aee785b");
    expect(keccak256("KimlikDAO".repeat(64)))
      .toBe("a5b68ade127ab4046c0555468bb3b1553f47ce6df2831b5d17e7ed27501cda51");
    expect(keccak256("kelime"))
      .toBe("ddc6ddf8e4d91bc0e904f0f4774ab750cd5ddd15167cc39146b61cc1de650aa9");
    expect(keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"))
      .toBe("8b73c3c69bb8fe3d512ecc4cf759cc79239f7b179b0ffacaa9a75d522b39400f");
    expect(keccak256("KPASS"))
      .toBe("9f448b217834c1795fa1012375379ddfe66572d54ef164e1262b3887de01e08f");
    expect(keccak256("1"))
      .toBe("c89efdaa54c0f20c7adf612882df0950f5a951637e0307cdcb4c672f298b8bc6");
  })
});

describe("keccak256Uint32() tests", () => {
  test("against precomputed values", () => {
    expect(keccak256Uint32(new Uint32Array([1, 2, 3, 4, 5])))
      .toEqual(new Uint32Array([
        1022115721, 3243319591, 1639853143, 3922376554, 200357399, 3457866910, 454272598, 3307673376
      ]));

    expect(keccak256Uint32(new Uint32Array(32)))
      .toEqual(new Uint32Array([
        1704142849, 4021456509, 2850049453, 957271323, 1949800621, 2839473245, 2826859299, 1032780803
      ]));

    expect(keccak256Uint32(new Uint32Array(33)))
      .toEqual(new Uint32Array([
        1877774715, 2536810181, 353523037, 1382876301, 1489394885, 2273392375, 1724133069, 2263322640
      ]));

    expect(hex.from(new Uint8Array(keccak256Uint32(new Uint32Array([0, 0, 0, 0xFF000000])).buffer, 0, 32)))
      .toBe("83c1ba322bb919d20c2e09ca70fd27bc245617a9e9abd5315b8afaebc4136044");
  });
});

test("keccak256Uint32ToHex() and keccak256Uint32() consistency", () => {
  const input = Uint32Array.from("123123123123");
  expect(hex.toUint8Array(keccak256Uint32ToHex(input)))
    .toEqual(new Uint8Array(keccak256Uint32(input).buffer as ArrayBuffer, 0, 32));
});

test("keccak256Uint32() and keccak256Uint8() consistentcy", () => {
  expect(new Uint8Array(keccak256Uint32(new Uint32Array(14)).buffer, 0, 32))
    .toEqual(keccak256Uint8(new Uint8Array(14 * 4)))
});
