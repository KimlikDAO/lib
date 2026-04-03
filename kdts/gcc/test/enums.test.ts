import { test } from "bun:test";
import { harness } from "../../util/testing/harness";
import { transpileTs } from "../transpile";

const expectEmit = harness(transpileTs);

test("enums", () => {
  expectEmit(`
    enum ChainId {
      x1 = "0x1",
      x144 = "0x144",
      x38 = "0x38",
      MinaMainnet = "mina:mainnet",
    }`, `
    /** @enum {string} */
    const ChainId = {
      x1: "0x1",
      x144: "0x144",
      x38: "0x38",
      MinaMainnet: "mina:mainnet"
    };
  `);
  expectEmit(`
    enum Animals {
      Dog = 1,
      Cat = 2,
    }`, `
    /** @enum {number} */
    const Animals = {
      Dog: 1,
      Cat: 2
    };
  `);
});
