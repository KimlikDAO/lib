import { Address } from "../address.d";
import { assemble, Program } from "./assembler";
import {
  calldataCopy,
  calldataSize,
  codeCopy,
  data,
  delegateCall,
  gas,
  ret,
  returndataCopy,
  returndataSize,
  returnOrRevert,
  sload,
  sstore,
} from "./combinators";
import { Bytes, get, use } from "./types";

const upgradableProxy = (slot: Bytes): Program =>
  assemble(
    calldataCopy(0),
    delegateCall(gas(), sload(slot), 0, calldataSize(), 0, 0),
    returndataCopy(0),
    returnOrRevert(get(1), 0, returndataSize()),
  );

const deployUpgradableProxy = (
  implAddress: Address,
  implSlot: Bytes,
): Program => {
  const runtime = data(upgradableProxy(implSlot));

  return assemble(
    sstore(implSlot, implAddress),
    runtime.len(),
    codeCopy(0, runtime.beg(), get(1)),
    ret(0, use(1)),
    runtime,
  );
};

export { deployUpgradableProxy, upgradableProxy };
