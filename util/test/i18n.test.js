import { describe, expect, it } from "bun:test";
import { LangCode, i18n } from "../i18n";

describe("i18n interpolation tests", () => {
  it("should concatenate plain strings", () => {
    expect(i18n`${"Hello"} ${"World"}`).toEqual({ [LangCode.EN]: "Hello World" });
  });

  it("should concat I18nString and string", () => {
    expect(i18n`${{
      [LangCode.EN]: "Hello", [LangCode.TR]: "Merhaba"
    }} ${"World"}`).toEqual({
      [LangCode.EN]: "Hello World",
      [LangCode.TR]: "Merhaba World"
    });
  });

  it("should concat I18nStrings", () => {
    expect(i18n`${{
      [LangCode.EN]: "Hello", [LangCode.TR]: "Merhaba"
    }} ${{ [LangCode.EN]: "World", [LangCode.TR]: "Dünya" }}`).toEqual({
      [LangCode.EN]: "Hello World",
      [LangCode.TR]: "Merhaba Dünya"
    });
  });
});
