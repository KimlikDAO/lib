import { ERC20, ERC20Permit } from "./ERC20";
import { ChainId } from "../../crosschain/chains";

/** @enum {number} */
const TokenCode = {
  GAST: 0, // native gas token
  USDT: 1,
  USDC: 2
};

/** @const {Record<ChainId, (ERC20 | null)[]>} */
const Tokens = {
  [ChainId.x1]: [
    null,
    new ERC20(ChainId.x1, "0xdAC17F958D2ee523a2206206994597C13D831ec7"),
    new ERC20Permit(ChainId.x1, "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", "USD Coin", 2),
  ],
  [ChainId.xa4b1]: [
    null,
    new ERC20Permit(ChainId.xa4b1, "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9", "Tether USD", 1),
    new ERC20Permit(ChainId.xa4b1, "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8", "USD Coin (Arb1)", 1),
  ],
  [ChainId.xa86a]: [
    null,
    new ERC20Permit(ChainId.xa86a, "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7", "TetherToken", 1),
    new ERC20Permit(ChainId.xa86a, "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E", "USD Coin", 2),
  ],
  [ChainId.x89]: [
    null,
    new ERC20(ChainId.x89, "0xc2132D05D31c914a87C6611C10748AEb04B58e8F"),
    new ERC20(ChainId.x89, "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"),
  ],
  [ChainId.x38]: [
    null,
    null,
    new ERC20(ChainId.x38, "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", 18),
  ],
};

export { Tokens, TokenCode };
