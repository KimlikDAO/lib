import { afterAll, describe, expect, it } from "bun:test";
import process from "node:process";
import compiler from "../compiler";
import { compileComponent } from "../component";
import { fibonacci } from "./birim/jsxcomp/comp";

process.chdir("kastro/compiler/test");

describe("compileComponent tests", () => {
  it("should pass variables to jsx component", async () => {
    const pageGlobals = {
      Lang: "tr",
      BuildMode: compiler.BuildMode.Compiled,
      SharedCss: new Set(),
      PageCss: new Set()
    };
    const html = await compileComponent("birim/jsxcomp", {
      "data-n": 100
    }, pageGlobals);
    expect(html).toContain(fibonacci(100n).toString());
  });

  it("should perform variable sub / string interpolation", async () => {
    const pageGlobals = {
      Lang: "tr",
      BuildMode: compiler.BuildMode.Compiled,
      SharedCss: new Set(),
      PageCss: new Set()
    };
    const html = await compileComponent("birim/cüzdan", {}, pageGlobals);
    expect(html).toContain("KPass eklendi.");
    expect(html).toContain('id="var1value"');
    expect(html).toContain("<span>0x1</span>");
  })
});

afterAll(() => process.chdir("../../.."));
