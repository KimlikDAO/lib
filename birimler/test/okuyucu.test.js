import { describe, expect, test } from "bun:test";
import { birimOku, sayfaOku, tagYaz } from "../okuyucu";

describe("tagYaz tests", () => {
  test("should serialize empty tag", () => {
    expect(tagYaz("tag", {}, false)).toBe("<tag>");
  })

  test("should serialize self-closing tags", () => {
    expect(tagYaz("tag2", {}, true)).toBe("<tag2/>");
  })

  test("should serialize a tag with attributes", () => {
    expect(tagYaz("tag", { a: 2, b: 3, d: 4, e: false }, false))
      .toBe('<tag a="2" b="3" d="4" e>');
  })
});

describe("sayfaOku tests", () => {
  test("should remove in prod mode", () => {
    /** @const {string} */
    const sayfa = sayfaOku("ana/sayfa.html", { dil: "tr", dev: true, kök: "birimler/test/" });
    expect(sayfa).toContain("ana/sayfa.css");
    expect(sayfa).toContain("Cüzdan eklendi");
    expect(sayfa).toContain("KPASS eklendi");
    expect(sayfa).toContain("birim/kpass/birim.css");

    expect(sayfa).toContain("<b>kalın</b>");
    expect(sayfa).not.toContain("bold");
  })

  test("should perform comment substitution", () => {
    /** @const {string} */
    const sayfaEN = sayfaOku("ana/sayfa.html", { dil: "en", kök: "birimler/test/" });
    /** @const {string} */
    const sayfaTR = sayfaOku("ana/sayfa.html", { dil: "tr", kök: "birimler/test/" });
    expect(sayfaTR).toContain("Toplam: 1,00");
    expect(sayfaEN).toContain("Total: 1.00");
  })

  test("should perform inline substitution", () => {
    /** @const {string} */
    const sayfaEN = sayfaOku("ana/sayfa.html", { dil: "en", dev: true, kök: "birimler/test/" });

    expect(sayfaEN).toContain('svg width="33" height="33"');
    expect(sayfaEN).toContain('svg" id="ansvg"');
    expect(sayfaEN).toContain('<path d="M1,2L1,2"/>');
    expect(sayfaEN).not.toContain("</path>");
  })

  test("should perform innertext substitution", () => {
    /** @const {string} */
    const sayfa = sayfaOku("ana/sayfa.html", { dil: "en", dev: false, kök: "birimler/test/" });

    expect(sayfa).toContain('<div>Unvan</div>');
    expect(sayfa).not.toContain('titrspan');
  })

  test("should perform English substitution", () => {
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
  })
});

describe("birimOku tests", () => {
  test("should perform variable substitution", () => {
    const { html, _ } = birimOku("ana/sayfa.html", { dil: "tr", dev: true, kök: "birimler/test/" }, {});

    expect(html).toContain('id="var1value"');
  })

  test("should eliminate self-closing xml tags", () => {
    const { html, _ } = birimOku("birim/logo.svg", { dil: "tr", dev: false, kök: "birimler/test/" }, {});

    expect(html).not.toContain("</stop>");
    expect(html).not.toContain("</path>");
  })

  test("should perform parametric content generation", () => {
    const { html, _ } = birimOku("birim/cüzdan/birim.html", { dil: "tr", dev: false, kök: "birimler/test/" }, {});

    expect(html).toContain("<div>354224848179261915075</div>");
    expect(html).toContain("<div>201</div>");
    expect(html).toContain("<div>20003</div");
  })
})
