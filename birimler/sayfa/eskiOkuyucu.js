import { minify } from "html-minifier";
import { Parser } from "htmlparser2";
import assert from "node:assert";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { optimize } from "svgo";
import { KapalıTagler, tagYaz } from "../../util/html";
import { getExt } from "../../util/paths";
import { getByKey } from "../hashcache/buildCache";
import { hashAndCompressContent, hashFile } from "../hashcache/compression";
import HtmlMinifierConfig from "./htmlMinifierConfig.js";
import { renderParagraph } from "./latex";
import SvgoConfig from "./svgoConfig";
import SvgoInlineConfig from "./svgoInlineConfig";
import { generateScript, generateStylesheet, webp } from "./targets";

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

const normalizePath = (path) => path.replace(/^(\/|\.\/)/, '');

/**
 * @param {!Object<string, string>} attribs
 * @param {!Object<string, string>} options
 * @return {!Promise<string>}
 */
const generateImage = (attribs, options) => {
  const type = getExt(attribs.src);
  const fileName = normalizePath(attribs.src);
  delete attribs["src"];

  if ("data-inline" in attribs) {
    delete attribs["data-inline"];
    assert.equal(type, "svg", "We only support inlining svgs. For binary formats, not inlining is more efficient");
    return getByKey(fileName, () =>
      birimOku(fileName, { dev: false }, attribs)
        .then((svg) => optimize(svg, SvgoInlineConfig).data))
  }

  const generate = {
    "svg": () => (options.dev
      ? Promise.resolve(fileName)
      : getByKey(fileName, () => svgOku({ konum: fileName, dev: options.dev })
        .then((svg) => hashAndCompressContent(svg, "svg"))))
      .then((hashedName) => {
        attribs.src = hashedName;
        return tagYaz("img", attribs, true);
      }),
    "png": () => {
      const webpName = `build/${fileName.slice(0, -4)}.webp`;
      const { passes, quality, ...atts } = attribs;
      return (options.dev
        ? Promise.resolve(fileName)
        : getByKey(fileName,
          () => webp(fileName, webpName, passes, quality)
            .then(() => hashFile(webpName))))
        .then((hashedName) => {
          atts.src = hashedName;
          return tagYaz("img", atts, true);
        });
    }
  };
  return generate[type]();
}

/**
 * @param {string} birimAdı
 * @param {!Seçimler} seçimler
 * @param {!Object<string, string>}  anaNitelikler Kök birimin nitelikleri
 * @return {!Promise<string>} the html
 */
const birimOku = (birimAdı, seçimler, anaNitelikler) => {
  seçimler.ortakCss ||= new Set();
  seçimler.yerelCss ||= new Set();

  birimAdı = normalizePath(birimAdı);
  /** @const {string} */
  const birimDosyaAdı = birimAdı.endsWith("sayfa.html") || birimAdı.endsWith("birim.html")
    ? "/birim.html" : "/comp.html";
  /** @const {boolean} */
  const EN = seçimler.dil == "en";
  /** @const {!Object<string, string>} */
  const değiştirHaritası = {};
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
  /** @const {!Array<string|!Promise<string>>} */
  let htmlParts = [];

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
    const üreticiBirim = require(process.cwd() + "/" + birimAdı, "utf8");
    return Promise.resolve("" + üreticiBirim.üret(değerler));
  }

  değerler.piggyback ||= "";

  const değerleriGir = (template) => template.replace(/{\s*([^}]+)\s*}/g, (_, expression) => {
    const [key, defaultValue] = expression.split(/\s*\|\|\s*/).map(s => s.trim());
    /** @const {string} */
    const lookupKey = key.startsWith("i18n:")
      ? (seçimler.dil + key.slice(4)) in değerler
        ? seçimler.dil + key.slice(4)
        : key.slice(5)
      : key;

    if (lookupKey in değerler) {
      return değerler[lookupKey];
    } else if (defaultValue) {
      return defaultValue.replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
    } else {
      return '';
    }
  });

  /** @const {!Parser} */
  const parser = new Parser({
    onopentag(ad, nitelikler, kapalı) {
      kapalı ||= KapalıTagler[ad];
      derinlik += 1;

      if (ad.toLowerCase() == "html")
        nitelikler.lang = seçimler.dil;

      if (!seçimler.dev && ad.toLowerCase() == "script")
        return htmlParts.push(generateScript(nitelikler, seçimler));

      if (ad.toLowerCase() == "img")
        return htmlParts.push(generateImage(nitelikler, seçimler));

      if (ad.toLowerCase() == "link" && nitelikler.rel == "stylesheet")
        return (("data-shared" in nitelikler) ? seçimler.ortakCss : seçimler.yerelCss)
          .add(normalizePath(nitelikler.href));

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

      /** @type {!Promise<string>|string} */
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

        if (nitelik[2] == ":") {
          if (nitelik.slice(0, 2) == seçimler.dil) {
            if (nitelik.slice(3) == "text") {
              değiştirDerinliği = derinlik;
              değiştirMetni = nitelikler[nitelik];
            } else nitelikler[nitelik.slice(3)] = nitelikler[nitelik];
          }
          delete nitelikler[nitelik];
        } else if (nitelik.startsWith("data-remove-")) {
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

      for (const nitelik in nitelikler) {
        const val = nitelikler[nitelik];
        if (val.includes("{"))
          nitelikler[nitelik] = değerleriGir(val);
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
        htmlParts.push(birimOku(birimDizini + birimDosyaAdı, seçimler, nitelikler));
        return;
      }

      // altbirim haricinde ":" içeren taglar dizin olarak parse ediliyor.
      // TODO(KimlikDAO-bot): Birimin içini parse edip birime yolla.
      if (ad.includes(":")) {
        htmlParts.push(
          birimOku(ad.replaceAll(":", "/") + birimDosyaAdı, seçimler, nitelikler));
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
        const phantomMu = "data-phantom" in nitelikler || ad.toLowerCase() == "i18n";
        /** @const {string} */
        const üreticiAdı =
          `${birimAdı.slice(0, birimAdı.lastIndexOf("/"))}/${nitelikler["data-generate"]}.js`;
        delete nitelikler["data-generate"];
        değiştirDerinliği = derinlik;
        değiştirMetni = birimOku(üreticiAdı, değerler, nitelikler)
          .then((üretilenHtml) => seçimler.dev
            ? üretilenHtml
            : üretilenHtml.replace(
              new RegExp(Object.keys(değiştirHaritası).join('|'), 'g'),
              (sol) => değiştirHaritası[sol]
                ? değerler.piggyback + değiştirHaritası[sol] : sol
            ))
        // TODO(KimlikDAO-bot): why do we have this?
        if (phantomMu) nitelikler["data-phantom"] = "";
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

      if ("data-phantom" in nitelikler || ad.toLowerCase() == "i18n") {
        if (ad != "span" && ad != "g" && ad != "div" && ad != "i18n") {
          console.error("Span div, veya g olmayan phantom!");
          process.exit(HataKodu.INCORRECT_PHANTOM);
        }
        phantom[derinlik] = true;
      } else {
        if (derinlik == 1)
          Object.assign(nitelikler, anaNitelikler);
        htmlParts.push(tagYaz(ad, nitelikler, kapalı));
      }

      htmlParts.push(değiştirMetni);
    },

    ontext(metin) {
      if (değiştirDerinliği <= 0) {
        if (sırada) {
          htmlParts.push(sırada);
          sırada = null;
        } else {
          htmlParts.push(latexDerinliği > 0
            ? renderParagraph(metin)
            : değerleriGir(metin));
        }
      }
    },

    oncomment(yorum) {
      yorum = yorum.trim();
      if (EN && yorum.startsWith("en:"))
        sırada = yorum.slice(3);
    },

    onclosetag(ad, hayali) {
      hayali ||= KapalıTagler[ad];
      sırada = null;
      if (derinlik == değiştirDerinliği)
        değiştirDerinliği = 0;
      if (derinlik == latexDerinliği)
        latexDerinliği = 0;
      if (değiştirDerinliği == 0 && !phantom[derinlik] && !hayali)
        htmlParts.push(`</${ad}>`);

      phantom[derinlik] = false;
      derinlik -= 1;
    },

    onprocessinginstruction(ad, veri) {
      if (ad.toLowerCase() == "!doctype")
        htmlParts.push(`<${veri}>`);
    }
  }, {
    recongnizeSelfClosing: true,
    lowerCaseTags: false,
    lowerCaseAttributeNames: false,
  });

  const jsxDosyaAdı = birimAdı.slice(0, -4) + "jsx";
  return (
    existsSync(jsxDosyaAdı)
      ? import(process.cwd() + "/" + jsxDosyaAdı)
        .then((comp) => comp.default(değerler))
      : readFile(birimAdı, "utf8"))
    .then((content) => {
      parser.end(content);
      const cssDosyaAdı = birimAdı.slice(0, -4) + "css";
      if (!seçimler.ortakCss.has(cssDosyaAdı)
        && !seçimler.yerelCss.has(cssDosyaAdı)
        && existsSync(cssDosyaAdı))
        seçimler.yerelCss.add(cssDosyaAdı);

      if (latexVar)
        seçimler.yerelCss.add("/lib/birimler/sayfa/latex.css");

      return Promise.all(htmlParts).then((parts) => parts.join(""));
    })
}

/**
 * @param {!Seçimler} seçimler
 * @return {!Promise<string>}
 */
const sayfaOku = async (seçimler) => {
  seçimler.yerelCss = new Set();
  seçimler.ortakCss = new Set();

  return birimOku(seçimler.konum, seçimler, {})
    .then((html) => {
      console.log(seçimler);
      if (seçimler.dev) {
        /** @type {string} */
        let linkler = "";
        /** @const {!Set<string>} */
        const cssler = seçimler.yerelCss.union(seçimler.ortakCss);
        for (const css of cssler)
          linkler += `  <link href="${css}" rel="stylesheet" type="text/css" />\n`;
        return html.replace("</head>", linkler + "</head>");
      }
      return generateStylesheet([...seçimler.yerelCss])
        .then((stylesheet) => minify(
          html.replace("</head>", stylesheet + "\n</head>"),
          HtmlMinifierConfig
        ));
    });
}

/**
 * Verilen konumdan svg içeriğini okur. Eğer uzantı .m.js ise içeriğini kasto
 * kurallarına göre günceller.
 *
 * Eğer `!seçimler.dev` is içeriği svgo ile optimize eder.
 *
 * @param {!Object<string, string>} seçimler
 * @return {!Promise<string>}
 */
const svgOku = (seçimler) => (
  seçimler.konum.endsWith(".m.svg")
    ? birimOku(seçimler.konum, seçimler)
    : readFile(seçimler.konum, "utf8"))
  .then((svg) => seçimler.dev ? svg : optimize(svg, SvgoConfig).data);

export {
  birimOku,
  HataKodu,
  sayfaOku,
  svgOku,
  tagYaz
};
