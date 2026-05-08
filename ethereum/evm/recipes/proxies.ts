import { Address } from "../../address.d";
import { assemble, Program } from "../assembler";
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
} from "../builtins";
import { get } from "../expression";
import { blob, set } from "../statement";
import { Bytes } from "../types";

const upgradableProxy = (slot: Bytes): Program =>
  assemble(
    calldataCopy(0),
    set("success", delegateCall(gas(), sload(slot), 0, calldataSize(), 0, 0)),
    returndataCopy(0),
    returnOrRevert(get("success"), 0, returndataSize()),
  );

const createUpgradableProxy = (
  implAddress: Address,
  implSlot: Bytes,
): Program => {
  const runtime = blob(upgradableProxy(implSlot));

  return assemble(
    sstore(implSlot, implAddress),
    set("x", runtime.len()),
    codeCopy(0, runtime.beg(), get("x")),
    ret(0, get("x")),
    runtime,
  );
};

export { createUpgradableProxy, upgradableProxy };
