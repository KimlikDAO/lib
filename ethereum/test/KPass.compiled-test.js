import { ChainId } from "../../crosschain/chains";
import { assertEq } from "../../testing/assert";
import KPass from "../KPass";

assertEq(KPass.isTokenAvailable(ChainId.xa86a, 1), true);
assertEq(KPass.isTokenAvailable(ChainId.x406, 1), false);

assertEq(KPass.isTokenERC20Permit(ChainId.x1, 1), false);
assertEq(KPass.isTokenERC20Permit(ChainId.x1, 2), true);
assertEq(KPass.isTokenERC20Permit(ChainId.xa86a, 1), true);
assertEq(KPass.isTokenERC20Permit(ChainId.x406, 1), false);
