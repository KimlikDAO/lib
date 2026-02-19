import { it } from "bun:test";
import { RemoteProvider } from "../../provider";
import KPass from "../KPass";

it("compiles", async () => {
  const provider = new RemoteProvider(() => Promise.resolve("0x"));
  KPass.setProvider(provider);
});
