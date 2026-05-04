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
} from "./combinators";
import { blob, Bytes, get, use } from "./types";

const upgradableProxy = (slot: Bytes): Program =>
  assemble(
    calldataCopy(0),
    delegateCall(gas(), sload(slot), 0, calldataSize(), 0, 0),
    returndataCopy(0),
    returnOrRevert(get(1), 0, returndataSize()),
  );

const createUpgradableProxy = (
  implAddress: Address,
  implSlot: Bytes,
): Program => {
  const runtime = blob(upgradableProxy(implSlot));

  return assemble(
    sstore(implSlot, implAddress),
    runtime.len(),
    codeCopy(0, runtime.beg(), get(1)),
    ret(0, use(1)),
    runtime,
  );
};

export { createUpgradableProxy, upgradableProxy };
