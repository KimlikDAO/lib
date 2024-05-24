import { assert, assertEq } from "../../testing/assert";
import { PublicKey } from "../mina";

const testPublicKey = () => {
  const pk = PublicKey.fromBase58("B62qoDr5nqJqKVRU4SyG2gUtZ8QeiXZ2N9C5s5amfMCkGtJxVor4bSg");

  assertEq(pk.x, 15700009165632333463033215207293744423217119730549469715303355600196922327182n);
  assert(pk.isOdd);
}

testPublicKey();
