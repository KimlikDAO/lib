import { Parser } from "htmlparser2";
import { existsSync, readFileSync } from "node:fs";
import { KapalıTagler, tagYaz } from "../../util/html.js";
import { renderParagraph } from "./latex.js";

/**
 * @enum {number}
 */
const HataKodu = {
  UNSUPPORTED_INLINE: 1,
  NESTED_REPLACE: 2,
  INCORRECT_PHANTOM: 3
}

/**
 * @typedef {{
 *   dil: string,
 *   dev: boolean,
 * }}
 */
const Seçimler = {};

/**
 * @param {string} birimAdı
 * @param {!Seçimler} seçimler
 * @param {!Object<string, string>}  anaNitelikler Kök birimin nitelikleri
 * @return {{
*   html: string,
*   cssler: !Set<string>
* }}
*/
const birimOku = (birimAdı, seçimler, anaNitelikler) => {
  /** @const {string} */
  const birimDosyaAdı = birimAdı.endsWith("sayfa.html") || birimAdı.endsWith("birim.html")
    ? "/birim.html" : "/comp.html";
  /** @const {boolean} */
  const EN = seçimler.dil == "en";
  /** @const {!Set<string>} */
  const cssler = new Set();
  /** @const {!Object<string, string>} */
  const değiştirHaritası = {};
  /** @type {string} */
  let html = "";
  /** @const {!Array<boolean>} */
  const phantom = [];
  /** @type {number} */
  let derinlik = 0;
  /** @type {number} */
  let değiştirDerinliği = 0;
  /** @type {string} */
  let sırada;
  /** @type {boolean} */
  let latexVar = false;
  /** @type {number} */
  let latexDerinliği = 0;

  seçimler.kök ||= "";

  /**
   * Bütün `Seçimler`i değerlere de kopyalıyoruz, böylelikle html
   * içerisinde de seçimlere ulaşabiliyoruz.
   *
   * @const {!Object<string, string>}
   */
  const değerler = Object.assign({}, seçimler);
  for (const nitelik in anaNitelikler)
    if (nitelik.startsWith("data-")) {
      değerler[nitelik.slice(5)] = anaNitelikler[nitelik];
      delete anaNitelikler[nitelik];
    }

  if (birimAdı.endsWith(".js")) {
    const üreticiBirim = require(process.cwd() + "/" + seçimler.kök + birimAdı, "utf8");
    return {
      html: "" + üreticiBirim.üret(değerler),
      cssler: new Set(),
    };
  }

  değerler.piggyback ||= "";

  /** @const {!Parser} */
  const parser = new Parser({
    onopentag(ad, nitelikler, kapalı) {
      kapalı ||= KapalıTagler[ad];
      derinlik += 1;

      if ("data-dev-remove" in nitelikler) {
        delete nitelikler["data-dev-remove"];
        if (seçimler.dev) return;
      }
      if ("data-remove" in nitelikler) {
        delete nitelikler["data-remove"];
        if (!seçimler.dev) return;
      }
      if ("data-remove-if" in nitelikler) {
        const remove = değerler[nitelikler["data-remove-if"]]
        delete nitelikler["data-remove-if"];
        if (remove) return;
      }

      if (değiştirDerinliği > 0) return;

      /** @type {string} */
      let değiştirMetni = "";

      for (const /** string */ nitelik in nitelikler) {
        if (!seçimler.dev) {
          /** @const {string} */
          const değer = nitelikler[nitelik];
          /**
           * Niteliğin değeri `değiştirHaritası`nda varsa değerini değiştir.
           *
           * @const {string}
           */
          const yeniDeğer = değiştirHaritası[değer.startsWith("/") ? değer : "/" + değer];
          if (yeniDeğer) nitelikler[nitelik] = değerler.piggyback + yeniDeğer;
        }

        if (nitelik.startsWith("data-remove-")) {
          if (!seçimler.dev)
            delete nitelikler[nitelik.slice("data-remove-".length)];
          delete nitelikler[nitelik];
        } else if (nitelik.startsWith("data-en-")) {
          if (EN) nitelikler[nitelik.slice("data-en-".length)] = nitelikler[nitelik];
          delete nitelikler[nitelik];
        } else if (nitelik.startsWith("data-set-")) {
          /** @const {string} */
          const value = değerler[nitelikler[nitelik]];
          if (value)
            if (nitelik == "data-set-innertext") {
              const valueEN = değerler[nitelikler[nitelik] + "-en"];
              değiştirDerinliği = derinlik;
              değiştirMetni = EN && valueEN ? valueEN : value;
            }
            else nitelikler[nitelik.slice("data-set-".length)] = value;
          delete nitelikler[nitelik];
        }
      }

      if ("data-inherit" in nitelikler) {
        for (const değişken of nitelikler["data-inherit"].split(/[ ,]+/))
          if (değerler[değişken])
            nitelikler["data-" + değişken] = değerler[değişken];
        delete nitelikler["data-inherit"];
      }

      if (ad.startsWith("altbirim:") || ad.startsWith("subcomponent:")) {
        /** @const {string} */
        const birimDizini = birimAdı.slice(0, birimAdı.lastIndexOf("/") + 1)
          + ad.slice(ad.indexOf(":") + 1).replaceAll(":", "/")
        const {
          html: /** @const {string} */ birimHtml,
          cssler: /** @const {!Set<string>} */ birimCssler
        } = birimOku(birimDizini + birimDosyaAdı, seçimler, nitelikler);
        html += birimHtml;
        for (const css of birimCssler)
          cssler.add(css);
        return;
      }

      // altbirim haricinde ":" içeren taglar dizin olarak parse ediliyor.
      // TODO(KimlikDAO-bot): Birimin içini parse edip birime yolla.
      if (ad.includes(":")) {
        const {
          html: /** @const {string} */ birimHtml,
          cssler: /** @const {!Set<string>} */ birimCssler
        } = birimOku(ad.replaceAll(":", "/") + birimDosyaAdı, seçimler, nitelikler);
        html += birimHtml;
        for (const css of birimCssler)
          cssler.add(css);
        return;
      }

      if ("data-inline" in nitelikler) {
        if (ad != "img") {
          console.error("Şimdilik sadece img inline edilebilir!");
          process.exit(HataKodu.UNSUPPORTED_INLINE);
        }
        /** @type {string} */
        let inlineAdı = nitelikler.src.slice(1);
        if (!seçimler.dev && inlineAdı.endsWith(".svg"))
          inlineAdı = `build/${inlineAdı.slice(0, -4)}.isvg`;
        delete nitelikler["data-inline"];
        delete nitelikler["src"];
        const {
          html: birimHtml,
          cssler: _,
        } = birimOku(inlineAdı, seçimler, nitelikler);
        html += birimHtml;
        return;
      }

      if ("data-en" in nitelikler) {
        if (değiştirDerinliği) {
          console.error("İç içe dile göre değiştirme mümkün değil");
          process.exit(HataKodu.NESTED_REPLACE);
        }
        if (EN) {
          değiştirDerinliği = derinlik;
          değiştirMetni = nitelikler["data-en"];
        }
        delete nitelikler["data-en"];
      }

      if ("data-generate" in nitelikler) {
        if (değiştirDerinliği) {
          console.error("İç içe değiştirme mümkün değil");
          process.exit(HataKodu.NESTED_REPLACE);
        }
        /** @const {boolean} */
        const phantom = "data-phantom" in nitelikler;
        /** @const {string} */
        const üreticiAdı =
          `${birimAdı.slice(0, birimAdı.lastIndexOf("/"))}/${nitelikler["data-generate"]}.js`;
        delete nitelikler["data-generate"];
        let {
          html: üretilenHtml,
          _
        } = birimOku(üreticiAdı, değerler, nitelikler);
        if (phantom) nitelikler["data-phantom"] = "";

        if (üretilenHtml) {
          if (!seçimler.dev)
            üretilenHtml = üretilenHtml.replace(
              new RegExp(Object.keys(değiştirHaritası).join('|'), 'g'),
              (sol) => değiştirHaritası[sol]
                ? değerler.piggyback + değiştirHaritası[sol] : sol
            );
          değiştirDerinliği = derinlik;
          değiştirMetni = üretilenHtml;
        }
      }

      if ("data-latex" in nitelikler) {
        latexVar = true;
        latexDerinliği = derinlik;
        delete nitelikler["data-latex"];
      }

      if (ad.toLowerCase() == "html") {
        for (const nitelik in nitelikler)
          if (nitelik.startsWith("data")) {
            seçimler[nitelik.slice(5)] = nitelikler[nitelik];
            delete nitelikler[nitelik];
          }
      }

      if ("data-phantom" in nitelikler) {
        if (ad != "span" && ad != "g" && ad != "div") {
          console.error("Span div, veya g olmayan phantom!");
          process.exit(HataKodu.INCORRECT_PHANTOM);
        }
        phantom[derinlik] = true;
      } else {
        if (derinlik == 1)
          Object.assign(nitelikler, anaNitelikler);
        html += tagYaz(ad, nitelikler, kapalı);
      }

      html += değiştirMetni;
    },

    ontext(metin) {
      if (değiştirDerinliği <= 0) {
        if (sırada) {
          html += latexDerinliği > 0
            ? renderParagraph(metin)
            : sırada;
          sırada = null;
        } else
          html += latexDerinliği > 0
            ? renderParagraph(metin)
            : metin;
      }
    },

    onclosetag(ad, hayali) {
      hayali ||= KapalıTagler[ad];
      sırada = null;
      if (derinlik == değiştirDerinliği)
        değiştirDerinliği = 0;
      if (derinlik == latexDerinliği)
        latexDerinliği = 0;
      if (değiştirDerinliği == 0 && !phantom[derinlik] && !hayali)
        html += `</${ad}>`;

      phantom[derinlik] = false;
      derinlik -= 1;
    },

    onprocessinginstruction(ad, veri) {
      if (ad.toLowerCase() == "!doctype")
        html += `<${veri}>`;
    }
  }, {
    recongnizeSelfClosing: true,
    lowerCaseTags: false,
    lowerCaseAttributeNames: false,
  });

  if (existsSync(seçimler.kök + birimAdı.slice(0, -4) + "css"))
    cssler.add(birimAdı.slice(0, -4) + "css");

  const jsxDosyaAdı = seçimler.kök + birimAdı.slice(0, -4) + "jsx";
  if (existsSync(jsxDosyaAdı)) {
    const üreticiBirim = require(process.cwd() + "/" + jsxDosyaAdı, "utf8");
    parser.end(üreticiBirim.default());
  } else
    parser.end(readFileSync(seçimler.kök + birimAdı, "utf8"));

  if (latexVar)
    cssler.add("/lib/util/latex.css");

  return {
    html,
    cssler
  }
}

/**
 * @param {!Seçimler} seçimler
 * @return {!Promise<{
 *   konum: string,
 *   html: string,
 *   defines: !Object
 * }>}
 */
const sayfaOku = (seçimler) => {
  const { html, cssler } = birimOku(seçimler.konum, seçimler, {});
  if (seçimler.dev) {
    /** @type {string} */
    let linkler = "";
    /** @type {boolean} */
    let ilk = true;
    for (const css of cssler) {
      if (ilk) {
        ilk = false;
        continue
      }
      linkler += `  <link href="${css}" rel="stylesheet" type="text/css" />\n`
    }
    return Promise.resolve({
      html: html.replace("</head>", linkler + "</head>"),
      defines: seçimler
    });
  }
  return Promise.resolve({
    html,
    defines: seçimler
  });
}

export {
  birimOku,
  HataKodu,
  sayfaOku,
};
