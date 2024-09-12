import { afterAll, describe, expect, it } from "bun:test";
import process from "node:process";
import { BuildMode } from "../compiler";
import { compilePage } from "../page";

process.chdir("kastro/compiler/test");

describe("compilePage() tests", () => {
  it("should remove in prod mode", async () => {
    /** @const {string} */
    const html = await compilePage("ana", {
      Lang: "tr",
      CodebaseLang: "tr",
      BuildMode: BuildMode.Dev,
      SharedCss: new Set(),
      PageCss: new Set()
    });
    expect(html).toContain(`html lang="tr"`);
    expect(html).not.toContain("l400.woff2");
    expect(html).not.toContain("l700.woff2");
    expect(html).toContain("PREVIOUS TEXT");
    expect(html).toContain("PREVIOUS 2ND TEXT");
    expect(html).not.toContain("titrspan");
    expect(html).toContain("<div>Unvan</div>");
  });
});

afterAll(() => process.chdir("../../.."));
