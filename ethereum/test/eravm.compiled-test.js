import { getCreateAddress } from "../../ethereum/eravm";
import { assertEq } from "../../testing/assert";

assertEq(
  getCreateAddress("0xE9D29Bf6Eaa12E6d79265BcC8E07F7Bf6085D53e", 0),
  "0xbb737b10dc8d002b303f81d5e3cb8087d8f05943"
);

assertEq(
  getCreateAddress("0xE9D29Bf6Eaa12E6d79265BcC8E07F7Bf6085D53e", 1),
  "0xd809ee48f9c8f6e72fe1E2DadEfAd825366360ad".toLowerCase()
);

assertEq(
  getCreateAddress("0xE9D29Bf6Eaa12E6d79265BcC8E07F7Bf6085D53e", 2),
  "0xAD3360fA2C9Ea7991bC809F356876cdE8232a67c".toLowerCase()
);

assertEq(
  getCreateAddress("0x7e5f4552091a69125d5dfcb7b8c2659029395bdf", 3),
  "0x5107b7154dfc1d3b7f1c4e19b5087e1d3393bcf4"
);
