import { Address } from "../address.d";
import { assemble, Program } from "./assembler";
import {
  calldataCopy,
  calldataSize,
  codeCopy,
  delegateCall,
  gas,
  ret,
  returndataCopy,
  returndataSize,
  returnOrRevert,
  sload,
  sstore,
} from "./builtins";
import { blob, dup, Expression, set, use } from "./syntax";
import { Bytes } from "./types";

const upgradableProxy = (slot: Bytes): Program =>
  assemble(
    calldataCopy(0),
    set("success", delegateCall(gas(), sload(slot), 0, calldataSize(), 0, 0)),
    returndataCopy(0),
    returnOrRevert(dup("success"), 0, returndataSize()),
  );

const createUpgradableProxy = (
  implAddress: Address,
  implSlot: Bytes,
): Program => {
  const runtime = blob(upgradableProxy(implSlot));

  return assemble(
    sstore(implSlot, implAddress),
    set("x", runtime.len()),
    codeCopy(0, Expression.fromFragment(runtime.beg()), dup("x")),
    ret(0, use("x")),
    runtime,
  );
};

export { createUpgradableProxy, upgradableProxy };
