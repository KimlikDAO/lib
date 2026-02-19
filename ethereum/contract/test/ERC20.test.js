import { expect, it } from "bun:test";
import { ChainId } from "../../../crosschain/chains";
import { ERC20, ERC20Permit } from "../ERC20";

/**
 * Minimal test: construct ERC20 and ERC20Permit to verify kdjs can compile the module.
 */
it("constructs ERC20 and ERC20Permit without error", () => {
  const token = new ERC20(ChainId.x1, "0x0000000000000000000000000000000000000000");
  expect(token.chainId).toBe(ChainId.x1);
  expect(token.contract).toBe("0x0000000000000000000000000000000000000000");

  const permit = new ERC20Permit(ChainId.x1, "0x0000000000000000000000000000000000000001", "Test", 1);
  expect(permit.name).toBe("Test");
  expect(permit.version).toBe(1);
});
