import { expect, test } from "bun:test";
import { sha256 } from "js-sha256";
import { sha256Uint32 } from "../../sha2";

const toUint8Arr = (uint32Arr: Uint32Array): Uint8Array => {
  const uint8Arr = new Uint8Array(uint32Arr.buffer, 0, 32);
  for (let i = 0, t0, t1; i < 32; i += 4) {
    t0 = uint8Arr[i + 0]; uint8Arr[i + 0] = uint8Arr[i + 3];
    t1 = uint8Arr[i + 1]; uint8Arr[i + 1] = uint8Arr[i + 2];
    uint8Arr[i + 3] = t0;
    uint8Arr[i + 2] = t1;
  }
  return uint8Arr;
}

const check = (itr1: string, itr2: string) => {
  expect(toUint8Arr(sha256Uint32(Uint32Array.from(itr1))))
    .toEqual(Uint8Array.from(sha256.array(Uint8Array.from(itr2))));
}

test("agrees with js-sha256 on select values", () => {
  check("1", "0001");
  check("123456", "000100020003000400050006");
  check("0".repeat(14), "0".repeat(4 * 14));
  check("0".repeat(15), "0".repeat(4 * 15));
  check("0".repeat(16), "0".repeat(4 * 16));
  check("0".repeat(17), "0".repeat(4 * 17));
});
