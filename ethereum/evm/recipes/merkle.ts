import {
  bitAnd,
  calldataLoad,
  eq,
  keccak256,
  mstore,
  mul,
  range,
  shr,
  sload,
  sub,
} from "../builtins";
import { get } from "../expression";
import { inline } from "../function";
import { set, unrollFor } from "../statement";
import { Data, Uint } from "../types";

const hashPairAtOffset = inline(
  { sibling: Data, offset: Uint, hash: Data },
  ({ sibling, offset, hash }) => [
    mstore(offset, hash),
    mstore(sub(32, offset), sibling),
    keccak256(0, 64),
  ],
);

const verifyMerkle = (depth: number) => inline(
  { leaf: Data, index: Uint },
  ({ leaf, index }) => [
    unrollFor(
      [
        set("hash", leaf),
        set("index", index),
      ],
      range(depth),
      (level) => [
        set("hash", hashPairAtOffset(
          calldataLoad(level * 32 + 64, Data),
          mul(bitAnd(get("index"), 1), 32),
          get("hash"),
        )),
        set("index", shr(1, get("index"))),
      ],
    ),
    eq(get("hash"), sload(0, Data)),
  ],
);

export { verifyMerkle };
