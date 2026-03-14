import { describe, expect, it } from "bun:test";
import { LangCode, i18n, localize } from "../i18n";

describe("i18n interpolation tests", () => {
  it("should concatenate plain strings", () => {
    expect(i18n`${"Hello"}, ${"World"}!`).toEqual({
      "en": "Hello, World!",
      "tr": "Hello, World!"
    });
  });

  it("should concat I18nString and string", () => {
    expect(i18n`${{
      [LangCode.EN]: "Hello", [LangCode.TR]: "Merhaba"
    }} ${"World"}!`).toEqual({
      [LangCode.EN]: "Hello World!",
      [LangCode.TR]: "Merhaba World!"
    });
  });

  it("should concat I18nStrings", () => {
    expect(i18n`--${{
      [LangCode.EN]: "Hello", [LangCode.TR]: "Merhaba"
    }}, ${{ [LangCode.EN]: "World", [LangCode.TR]: "Dünya" }}!`).toEqual({
      [LangCode.EN]: "--Hello, World!",
      [LangCode.TR]: "--Merhaba, Dünya!"
    });
  });
});

describe("localize", () => {
  it("string is unchanged per lang", () => {
    expect(localize("x", LangCode.EN)).toBe("x");
    expect(localize("x", LangCode.TR)).toBe("x");
  });
  it("object picks lang", () => {
    const v = { [LangCode.EN]: "Hi", [LangCode.TR]: "Merhaba" };
    expect(localize(v, LangCode.EN)).toBe("Hi");
    expect(localize(v, LangCode.TR)).toBe("Merhaba");
  });
});
