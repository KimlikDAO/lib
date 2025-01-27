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
  it("should handle pseudo-classes", async () => {
    const domIdMapper = new GlobalMapper();
    const cssCode = transpileCss("test.css", `
      /** @export {GreenishButton} */
      .green-button:hover { color: green; }
      /** @export */
      .blue-button:active { color: blue; }
      `, domIdMapper);
    const cssModule = /** @type {CssModule} */(await importCode(cssCode));
    expect(cssModule.default).toEqual({
      "GreenishButton": domIdMapper.map("mpa", "test.css", "green-button"),
      "BlueButton": domIdMapper.map("mpa", "test.css", "blue-button"),
    });
  });
});

describe("minifyCss", () => {
  it("should create enum entries for all selectors", () => {
    const domIdMapper = new GlobalMapper();
    const minified = minifyCss("test.css", `
      /** @domNamespace {iframe1} */
      .blue-button > .green-button, .red-button { color: blue; }
      `, domIdMapper);

    expect(minified.enumEntries["BlueButton"])
      .toBe(domIdMapper.map("iframe1", "test.css", "blue-button"));
    expect(minified.enumEntries["GreenButton"])
      .toBe(domIdMapper.map("iframe1", "test.css", "green-button"));
    expect(minified.enumEntries["RedButton"])
      .toBe(domIdMapper.map("iframe1", "test.css", "red-button"));
  });

  it("should handle pseudo-classes", () => {
    const domIdMapper = new GlobalMapper();
    const minified = minifyCss("test.css", `
      /** @domNamespace {iframe1} */
      .blue-button:active > .green-button:hover, .red-button { color: blue; }
      `, domIdMapper);

    expect(minified.enumEntries["BlueButton"])
      .toBe(domIdMapper.map("iframe1", "test.css", "blue-button"));
    expect(minified.enumEntries["GreenButton"])
      .toBe(domIdMapper.map("iframe1", "test.css", "green-button"));
    expect(minified.enumEntries["RedButton"])
      .toBe(domIdMapper.map("iframe1", "test.css", "red-button"));
  });

  it("should respect export as directives", () => {
    const domIdMapper = new GlobalMapper();
    const minified = minifyCss("test.css", `
      /**
       * @domNamespace {spa}
       * @export {ButtonWhichIsBlue}
       */
      .blue-button { color: blue; }
      `, domIdMapper);

    expect(minified.enumEntries["ButtonWhichIsBlue"])
      .toBe(domIdMapper.map("spa", "test.css", "blue-button"));
  });

  it("should throw on retroactive export as directive", () => {
    const domIdMapper = new GlobalMapper();
    expect(() => minifyCss("test.css", `
      /** @export {ButtonWhichIsBlue} */
      .green-button { color: green; }
      /** @domNamespace {iframe1} */
      .blue-button { color: blue; }
      `, domIdMapper)).toThrow();
  });
});
