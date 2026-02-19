import { it } from "bun:test";
import { Provider } from "../../provider";
import KPass from "../KPass";

it("compiles", async () => {
  const provider = new Provider(() => Promise.resolve("0x"));
  KPass.setProvider(provider);
});
