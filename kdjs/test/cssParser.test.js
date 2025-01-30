import { describe, expect, it } from "bun:test";
import { importCode } from "../../util/reflection";
import {
  CssModule,
  minifyCss,
  selectorToEnumKey,
  transpileCss
} from "../cssParser";
import { GlobalMapper } from "../domIdMapper";

describe("selectorToEnumKey", () => {
  it("should convert selector to enum key", () => {
    expect(selectorToEnumKey("blue-button")).toBe("BlueButton");
    expect(selectorToEnumKey("blue_button")).toBe("BlueButton");
    expect(selectorToEnumKey("blueButton")).toBe("blueButton");
    expect(selectorToEnumKey("PascalCase")).toBe("PascalCase");
    expect(selectorToEnumKey("a__PascalCase")).toBe("APascalCase");
    expect(selectorToEnumKey("a-PascalCase")).toBe("APascalCase");
    expect(selectorToEnumKey("mina")).toBe("mina");
    expect(selectorToEnumKey("x1")).toBe("x1");
  });
});

describe("transpileCss", () => {
  it("should parse exported selectors", async () => {
    const domIdMapper = new GlobalMapper();
    const cssCode = transpileCss("test.jsx", `
      body { color: red; }
      /** @export */
      .blue-button { color: blue; }
      /** @export */ .green-button { color: green; }
      `, domIdMapper);

    const cssModule = /** @type {CssModule} */(await importCode(cssCode));
    expect(cssModule.default).toEqual({
      "BlueButton": domIdMapper.map("mpa", "test.jsx", "blue-button"),
      "GreenButton": domIdMapper.map("mpa", "test.jsx", "green-button"),
    });
  });
  it("should parse export as directives", async () => {
    const domIdMapper = new GlobalMapper();
    const cssCode = transpileCss("test.jsx", `
      body { color: red; }
      /** @export {ButtonWhichIsBlue} */
      .blue-button { color: blue; }
      `, domIdMapper);

    const cssModule = /** @type {CssModule} */(await importCode(cssCode));
    expect(cssModule.default).toEqual({
      "ButtonWhichIsBlue": domIdMapper.map("mpa", "test.jsx", "blue-button"),
    });
  });
  it("should parse domNamespace directive", async () => {
    const domIdMapper = new GlobalMapper();
    const cssCode = transpileCss("test.jsx", `
      body { color: red; }
      /** @domNamespace {iframe1} */
      /** @export */
      .blue-button { color: blue; }
      `, domIdMapper);

    const cssModule = /** @type {CssModule} */(await importCode(cssCode));
    expect(cssModule.default).toEqual({
      "BlueButton": domIdMapper.map("iframe1", "test.jsx", "blue-button"),
    });
  });
  it("should throw on retroactive domNamespace directive", () => {
    const domIdMapper = new GlobalMapper();
    expect(() => transpileCss("test.jsx", `
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
    const cssCode = transpileCss("test.jsx", `
      /** @export {GreenishButton} */
      .green-button:hover { color: green; }
      /** @export */
      .blue-button:active { color: blue; }
      `, domIdMapper);
    const cssModule = /** @type {CssModule} */(await importCode(cssCode));
    expect(cssModule.default).toEqual({
      "GreenishButton": domIdMapper.map("mpa", "test.jsx", "green-button"),
      "BlueButton": domIdMapper.map("mpa", "test.jsx", "blue-button"),
    });
  });
});

describe("minifyCss", () => {
  it("should create enum entries for all selectors", () => {
    const domIdMapper = new GlobalMapper();
    const minified = minifyCss("test.jsx", `
      /** @domNamespace {iframe1} */
      .blue-button > .green-button, .red-button { color: blue; }
      `, domIdMapper);

    expect(minified.enumEntries["BlueButton"])
      .toBe(domIdMapper.map("iframe1", "test.jsx", "blue-button"));
    expect(minified.enumEntries["GreenButton"])
      .toBe(domIdMapper.map("iframe1", "test.jsx", "green-button"));
    expect(minified.enumEntries["RedButton"])
      .toBe(domIdMapper.map("iframe1", "test.jsx", "red-button"));
  });

  it("should handle pseudo-classes", () => {
    const domIdMapper = new GlobalMapper();
    const minified = minifyCss("test.jsx", `
      /** @domNamespace {iframe1} */
      .blue-button:active > .green-button:hover, .red-button { color: blue; }
      `, domIdMapper);

    expect(minified.enumEntries["BlueButton"])
      .toBe(domIdMapper.map("iframe1", "test.jsx", "blue-button"));
    expect(minified.enumEntries["GreenButton"])
      .toBe(domIdMapper.map("iframe1", "test.jsx", "green-button"));
    expect(minified.enumEntries["RedButton"])
      .toBe(domIdMapper.map("iframe1", "test.jsx", "red-button"));
  });

  it("should respect export as directives", () => {
    const domIdMapper = new GlobalMapper();
    const minified = minifyCss("test.jsx", `
      /**
       * @domNamespace {spa}
       * @export {ButtonWhichIsBlue}
       */
      .blue-button { color: blue; }
      `, domIdMapper);

    expect(minified.enumEntries["ButtonWhichIsBlue"])
      .toBe(domIdMapper.map("spa", "test.jsx", "blue-button"));
  });

  it("should throw on retroactive export as directive", () => {
    const domIdMapper = new GlobalMapper();
    expect(() => minifyCss("test.jsx", `
      /** @export {ButtonWhichIsBlue} */
      .green-button { color: green; }
      /** @domNamespace {iframe1} */
      .blue-button { color: blue; }
      `, domIdMapper)).toThrow();
  });
});
