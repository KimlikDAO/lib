import { readFile } from "node:fs/promises";
import { keccak256Uint8 } from "../crypto/sha3";
import { hex } from "../util/çevir";

/**
 * @param {string} output
 * @param {!Array<string>} deps
 * @param {function():void} run
 * @param {!Promise<{ fresh: boolean, hash: string}>}
 */
const runIfStale = async (output, deps, run) => {
  deps.sort();
  const hashesArr = await Promise.all(deps.map((dep) => readFile(dep)
    .then((depContent) => keccak256Uint8(depContent))));
  const computedArr = new Uint8Array(32);
  for (const h of hashesArr)
    for (let i = 0; i < 32; ++i)
      computedArr[i] += h[i]
  const computedHash = hex(computedArr);
  try {
    const storedHash = await readFile(output + ".hash", "utf8");
    return { fresh: storedHash == computedHash, hash: computedHash }
  } catch (_) {
    return { fresh: false, hash: computedHash };
  }
}

export { runIfStale };
