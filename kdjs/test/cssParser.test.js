import { describe, expect, it } from "bun:test";
import { importCode } from "../../testing/helper";
import { CssModule, minifyCss, transpileCss } from "../cssParser";
import { GlobalMapper } from "../domIdMapper";

describe("transpileCss", () => {
  it("should parse exported selectors", async () => {
    const domIdMapper = new GlobalMapper();
    const cssCode = transpileCss("test.css", `
      body { color: red; }
      /** @export */
      .blue-button { color: blue; }
      /** @export */ .green-button { color: green; }
      `, domIdMapper);

    const cssModule = /** @type {CssModule} */(await importCode(cssCode));
    expect(cssModule.default).toEqual({
      "BlueButton": domIdMapper.map("mpa", "test.css", "blue-button"),
      "GreenButton": domIdMapper.map("mpa", "test.css", "green-button"),
    });
  });
  it("should parse export as directives", async () => {
    const domIdMapper = new GlobalMapper();
    const cssCode = transpileCss("test.css", `
      body { color: red; }
      /** @export {ButtonWhichIsBlue} */
      .blue-button { color: blue; }
      `, domIdMapper);

    const cssModule = /** @type {CssModule} */(await importCode(cssCode));
    expect(cssModule.default).toEqual({
      "ButtonWhichIsBlue": domIdMapper.map("mpa", "test.css", "blue-button"),
    });
  });
  it("should parse domNamespace directive", async () => {
    const domIdMapper = new GlobalMapper();
    const cssCode = transpileCss("test.css", `
      body { color: red; }
      /** @domNamespace {iframe1} */
      /** @export */
      .blue-button { color: blue; }
      `, domIdMapper);

    const cssModule = /** @type {CssModule} */(await importCode(cssCode));
    expect(cssModule.default).toEqual({
      "BlueButton": domIdMapper.map("iframe1", "test.css", "blue-button"),
    });
  });
  it("should throw on retroactive domNamespace directive", () => {
    const domIdMapper = new GlobalMapper();
    expect(() => transpileCss("test.css", `
      body { color: red; }
      /** @export */
      .blue-button { color: blue; }
      /** @domNamespace {iframe1} */
      /** @export */
      .green-button { color: green; }
      `, domIdMapper)).toThrow();
  });
});

describe("minifyCss", () => {
  it("should parse exported selectors", async () => {
    const domIdMapper = new GlobalMapper();
    const cssCode = minifyCss("test.css", `
      body { color: red; }
      /** @export */
      .blue-button { color: blue; }
      /** @export */ .green-button { color: green; }
      `, domIdMapper);

    console.log(cssCode);
  });
});
