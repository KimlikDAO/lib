import { assertArrayEq, assertEq } from "../../testing/assert";
import { hex } from "../../util/çevir";
import { keccak256, keccak256Uint32 } from "../sha3";
import { keccak256 as keccak256_orig } from "./sha3_orig";
import { keccak256 as keccak256_prev } from "./sha3_prev";

const testKeccak256 = () => {
  assertEq(
    keccak256("a"),
    "3ac225168df54212a25c1c01fd35bebfea408fdac2e31ddd6f80a4bbf9a5f1cb"
  );

  assertEq(
    keccak256("KimlikDAO"),
    "27f13dbab0f15a910e07f535a5e00d7fa9aeecc05edf81fc9191b482f5b8f07b"
  );

  assertEq(
    keccak256("Deneme"),
    "62592aae22a4f32153836d2a5dccaf6995695fc0a15301b8b306d46aeb316f32"
  );

  assertEq(
    keccak256(""),
    "c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470"
  );

  assertEq(
    keccak256("3ac225168df54212a25c1c01fd35bebfea408fdac2e31ddd6f80a4bbf9a5f1cb".repeat(10)),
    "1d22484fbe32dff99e456dbca27b22db2c4c7d006cbc1addc58e08903aee785b"
  );

  assertEq(
    keccak256("KimlikDAO".repeat(64)),
    "a5b68ade127ab4046c0555468bb3b1553f47ce6df2831b5d17e7ed27501cda51"
  );

  assertEq(
    keccak256("kelime"),
    "ddc6ddf8e4d91bc0e904f0f4774ab750cd5ddd15167cc39146b61cc1de650aa9"
  );

  assertEq(
    keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
    "8b73c3c69bb8fe3d512ecc4cf759cc79239f7b179b0ffacaa9a75d522b39400f"
  );

  assertEq(
    keccak256("KPASS"),
    "9f448b217834c1795fa1012375379ddfe66572d54ef164e1262b3887de01e08f"
  );

  assertEq(
    keccak256("1"),
    "c89efdaa54c0f20c7adf612882df0950f5a951637e0307cdcb4c672f298b8bc6"
  );
}

const compareKeccak256 = () => {
  for (let i = 0; i < 1000; ++i) {
    let test = "abracadabra".repeat(i);
    const ours = keccak256(test);
    const prev = keccak256_prev(test);
    const orig = keccak256_orig(test);
    assertEq(ours, prev);
    assertEq(ours, orig)
  }

  for (let i = 0; i < 1000; ++i) {
    let test = "c".repeat(i);
    const ours = keccak256(test);
    const prev = keccak256_prev(test);
    const orig = keccak256_orig(test);
    assertEq(ours, prev);
    assertEq(ours, orig)
  }
}

const testKeccak256Uint32 = () => {
  assertArrayEq(
    keccak256Uint32(new Uint32Array([1, 2, 3, 4, 5])),
    new Uint32Array([
      1022115721, 3243319591, 1639853143, 3922376554, 200357399, 3457866910, 454272598, 3307673376
    ])
  );

  assertArrayEq(
    keccak256Uint32(new Uint32Array(32)),
    new Uint32Array([
      1704142849, 4021456509, 2850049453, 957271323, 1949800621, 2839473245, 2826859299, 1032780803
    ])
  );

  assertArrayEq(
    keccak256Uint32(new Uint32Array(33)),
    new Uint32Array([
      1877774715, 2536810181, 353523037, 1382876301, 1489394885, 2273392375, 1724133069, 2263322640
    ])
  );

  assertEq(
    hex(new Uint8Array(
      keccak256Uint32(
        new Uint32Array([0, 0, 0, 0xFF000000])).buffer, 0, 32)),
    "83c1ba322bb919d20c2e09ca70fd27bc245617a9e9abd5315b8afaebc4136044"
  );
}

const compareKeccak256Speed = () => {
  {
    console.time("1k keccak256_orig");
    let c = 0;
    for (let i = 0; i < 1000; ++i)
      c += parseInt(keccak256_orig("z".repeat(i))[0], 16);
    console.log(c);
    console.timeEnd("1k keccak256_orig");
  }
  {
    console.time("1k keccak256_prev");
    let c = 0;
    for (let i = 0; i < 1000; ++i)
      c += parseInt(keccak256_prev("z".repeat(i))[0], 16);
    console.log(c);
    console.timeEnd("1k keccak256_prev");
  }
  {
    console.time("1k keccak256");
    let c = 0;
    for (let i = 0; i < 1000; ++i)
      c += parseInt(keccak256("z".repeat(i))[0], 16);
    console.log(c);
    console.timeEnd("1k keccak256");
  }
}

testKeccak256();
compareKeccak256();
testKeccak256Uint32();
compareKeccak256Speed();
