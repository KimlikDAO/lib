import { describe, expect, it } from "bun:test";
import { birimOku, sayfaOku, tagYaz } from "../sayfa/eskiOkuyucu";

describe("tagYaz tests", () => {
  it("should serialize empty tag", () => {
    expect(tagYaz("tag", {}, false)).toBe("<tag>");
  });

  it("should serialize self-closing tags", () => {
    expect(tagYaz("tag2", {}, true)).toBe("<tag2/>");
  });

  it("should serialize a tag with attributes", () => {
    expect(tagYaz("tag", { a: 2, b: 3, d: 4, e: false }, false))
      .toBe('<tag a="2" b="3" d="4" e>');
  })
});

describe("sayfaOku tests", () => {
  it("should remove in prod mode", () => {
    /** @const {string} */
    const sayfa = sayfaOku("ana/sayfa.html", { dil: "tr", dev: true, kök: "birimler/test/" });
    expect(sayfa).toContain("ana/sayfa.css");
    expect(sayfa).toContain("Cüzdan eklendi");
    expect(sayfa).toContain("KPass eklendi");
    expect(sayfa).toContain("birim/kpass/birim.css");

    expect(sayfa).toContain("<b>kalın</b>");
    expect(sayfa).not.toContain("bold");
  });

  it("should perform comment substitution", () => {
    /** @const {string} */
    const sayfaEN = sayfaOku("ana/sayfa.html", { dil: "en", kök: "birimler/test/" });
    /** @const {string} */
    const sayfaTR = sayfaOku("ana/sayfa.html", { dil: "tr", kök: "birimler/test/" });
    expect(sayfaTR).toContain("Toplam: 1,00");
    expect(sayfaEN).toContain("Total: 1.00");
  });

  it("should perform inline substitution", () => {
    /** @const {string} */
    const sayfaEN = sayfaOku("ana/sayfa.html", { dil: "en", dev: true, kök: "birimler/test/" });

    expect(sayfaEN).toContain('svg width="33" height="33"');
    expect(sayfaEN).toContain('svg" id="ansvg"');
    expect(sayfaEN).toContain('<path d="M1,2L1,2"/>');
    expect(sayfaEN).not.toContain("</path>");
  });

  it("should perform innertext substitution", () => {
    /** @const {string} */
    const sayfa = sayfaOku("ana/sayfa.html", { dil: "en", dev: false, kök: "birimler/test/" });

    expect(sayfa).toContain('<div>Unvan</div>');
    expect(sayfa).not.toContain('titrspan');
  });

  it("should perform English substitution", () => {
    /** @const {string} */
    const sayfaEN = sayfaOku("ana/sayfa.html", { dil: "en", dev: false, kök: "birimler/test/" });
    /** @const {string} */
    const sayfaTR = sayfaOku("ana/sayfa.html", { dil: "tr", dev: false, kök: "birimler/test/" })

    expect(sayfaEN).toContain("REPLACED_TEXT");
    expect(sayfaEN).not.toContain("<test1>");
    expect(sayfaEN).not.toContain("</test1>");

    expect(sayfaEN).toContain("REPLACED_2NDTEXT");
    expect(sayfaEN).not.toContain("<test2>");
    expect(sayfaEN).not.toContain("</test2>");
  });
});

describe("birimOku tests", () => {
  it("should perform variable substitution", () => {
    const { html, _ } = birimOku("ana/sayfa.html", { dil: "tr", dev: true, kök: "birimler/test/" }, {});

    expect(html).toContain('id="var1value"');
  });

  it("should eliminate self-closing xml tags", () => {
    const { html, _ } = birimOku("birim/logo.svg", { dil: "tr", dev: false, kök: "birimler/test/" }, {});

    expect(html).not.toContain("</stop>");
    expect(html).not.toContain("</path>");
  });

  it("should perform parametric content generation", () => {
    const { html, _ } = birimOku("birim/cüzdan/birim.html", { dil: "tr", dev: false, kök: "birimler/test/" }, {});

    expect(html).toContain("<div>354224848179261915075</div>");
    expect(html).toContain("<div>201</div>");
    expect(html).toContain("<div>20003</div");
  });
});
