import { expect, it } from "bun:test";
import evm from "../../ethereum/evm";
import jsonrpc from "../jsonrpc";

/** @const {string} */
const OLD_TCKO_ADDR = "0xb97bf95b4f3110285727b70da5a7465bfd2098ca";

/** @const {number} */
const MILLION = 1_000_000;

it("should fetch KPass `balanceOf()`, `maxSupply()`, `decimals()` and `supplyCap()` in parallel",
  () => jsonrpc.callMulti("https://api.avax.network/ext/bc/C/rpc", "eth_call", [
    [{
      // balanceOf()
      "data": "0x70a08231" + evm.address("0xccc00bc7e6983b1901825888a7bb3bda3b051b12"),
      "to": OLD_TCKO_ADDR
    }, "latest"], [{
      "data": "0xd5abeb01", // maxSupply()
      "to": OLD_TCKO_ADDR
    }, "latest"], [{
      "data": "0x313ce567", // decimals()
      "to": OLD_TCKO_ADDR
    }, "latest"], [{
      "data": "0x8f770ad0", // supplyCap()
      "to": OLD_TCKO_ADDR
    }, "latest"],
  ]).then((/** @type {string[]} */ res) => {
    expect(parseInt(res[0].slice(-12), 16)).toBe(200_000 * MILLION);
    expect(parseInt(res[1].slice(-12), 16)).toBe(100_000_000 * MILLION);
    expect(parseInt(res[2].slice(-4), 16)).toBe(6);
    expect(parseInt(res[3].slice(-12), 16)).toBe(20_000_000 * MILLION);
  })
);
