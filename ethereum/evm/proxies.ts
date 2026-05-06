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
import { blob, Bytes, use, dup } from "./types";

const upgradableProxy = (slot: Bytes): Program =>
  assemble(
    calldataCopy(0),
    delegateCall(gas(), sload(slot), 0, calldataSize(), 0, 0),
    returndataCopy(0),
    returnOrRevert(dup(1), 0, returndataSize()),
  );

const createUpgradableProxy = (
  implAddress: Address,
  implSlot: Bytes,
): Program => {
  const runtime = blob(upgradableProxy(implSlot));

  return assemble(
    sstore(implSlot, implAddress),
    runtime.len(),
    codeCopy(0, runtime.beg(), dup(1)),
    ret(0, use(1)),
    runtime,
  );
};

export { createUpgradableProxy, upgradableProxy };
