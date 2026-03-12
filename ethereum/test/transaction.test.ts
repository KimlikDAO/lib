import { describe, expect, it } from "bun:test";
import { serialize } from "../transaction";

describe("serialize()", () => {
  it("serializes full request with all fields", () => {
    const out = serialize({
      from: "0xfrom",
      to: "0xto",
      data: "0xdata",
      value: 1n,
      chainId: "0x1",
      gas: 30000
    });
    expect(out.from).toBe("0xfrom");
    expect(out.to).toBe("0xto");
    expect(out.data).toBe("0xdata");
    expect(out.value).toBe("0x1");
    expect(out.chainId).toBe("0x1");
    expect(out.gas).toBe("0x7530");
  });
});
