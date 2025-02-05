import { LangCode } from "./i18n";

/** @define {boolean} */
const GEN = true;

/** @define {LangCode} */
const Lang = LangCode.TR;

/**
 * @nosideeffects
 * @template T
 * @param {!Object<LangCode, T>} i18ned
 * @return {T}
 */
const i18n = (i18ned) => i18ned[Lang];

/**
 * @noinline
 * @nosideeffects
 * @param {string} ad DOM biriminin adı.
 * @return {!Element}
 */
const adla = (ad) => /** @type {!Element} */(document.getElementById(ad));

/**
 * @noinline
 * @param {Element} birim
 */
const gizle = (birim) => birim.style.display = "none";

/**
 * @noinline
 * @param {Element} birim
 */
const göster = (birim) => birim.style.display = "";

/**
 * @noinline
 * @param {Element} birim
 * @param {boolean} göster
 */
const gösterGizle = (birim, göster) => birim.style.display = göster ? "" : "none";

/**
 * @noinline
 * @param {string} ad
 */
const adlaGizle = (ad) => adla(ad).style.display = "none";

/**
 * @noinline
 * @param {string} ad
 */
const adlaGöster = (ad) => adla(ad).style.display = "";

/**
 * @param {string} ad
 * @param {boolean} göster
 */
const adlaGösterGizle = (ad, göster) => gösterGizle(adla(ad), göster);

/**
 * @param {!HTMLAnchorElement} düğme Durdurulacak düğme.
 */
const düğmeDurdur = (düğme) => {
  düğme.onclick = null;
  düğme.classList.add("dis");
}

/**
 * @param {!Element} düğme
 * @param {!Element} menü
 */
const bindDropdown = (düğme, menü) => {
  menü.classList.add("nsh");
  menü.style.display = "";
  düğme.ontouchstart = menü.ontouchstart = (event) => event.stopPropagation();
  const kapat = () => {
    window["ontouchstart"] = window.onclick = null;
    düğme.classList.remove("sel");
    menü.classList.add("nsh");
  }
  düğme.onclick = (event) => {
    menü.classList.remove("nsh");
    düğme.classList.add("sel");
    const f = window.onclick;
    if (f) f(event);
    if (f !== kapat)
      window.onclick = window["ontouchstart"] = kapat;
    event.stopPropagation();
  }
}

/**
 * @param {!Element} pane
 * @param {number} index
 */
const slideCard = (pane, index) => {
  /** @const {number} */
  const width = pane.children[0].getBoundingClientRect().width;
  pane.style.transform = `translate3d(-${index * width}px,0,0)`;
}

/**
 * @param {string} url
 * @param {number} en
 * @param {number} boy
 */
const pencere = (url, en, boy) => {
  /** @const {number} */
  const sol = window.screenX + window.outerWidth - en;
  /** @const {Window} */
  const p = window.open(url, "_blank",
    `menubar=no,toolbar=no,status=no,width=${en},height=${boy},` +
    `left=${sol},top=${window.screenY}`
  );
  if (p) p.focus();
}

/**
 * @nosideeffects
 * @param {number} para
 * @return {string} metin olarak yazılmış para miktarı
 */
const paradanMetne = (para) => (para / 1_000_000).toLocaleString(Lang);

/**
 * @nosideeffects
 * @param {string} telefon
 * @return {string} formatlanmış telefon numarası
 */
const telefondanMetne = (telefon) =>
  telefon.slice(0, 3) + " (" + telefon.slice(3, 6) + ") " + telefon.slice(6, 9) + " " +
  telefon.slice(9, 11) + " " + telefon.slice(11);

/**
 * @param {string} id domId
 * @param {string} name
 * @return {!Element}
 */
const create = (id, name) => {
  const el = document.createElement(name);
  el.id = id;
  return el;
}

/**
 * @param {string} ad
 * @return {!HTMLAnchorElement}
 */
const a = (ad) => /** @type {!HTMLAnchorElement} */((GEN && globalThis["GEN"])
  ? create(ad, "a")
  : adla(ad));

/**
 * @param {string} ad
 * @return {!HTMLButtonElement}
 */
const button = (ad) => /** @type {!HTMLButtonElement} */((GEN && globalThis["GEN"])
  ? create(ad, "button")
  : adla(ad));

/**
 * @param {string} ad
 * @return {!HTMLFormElement}
 */
const form = (ad) => /** @type {!HTMLFormElement} */((GEN && globalThis["GEN"])
  ? create(ad, "form")
  : adla(ad));

/**
 * @param {string} ad
 * @return {!HTMLSpanElement}
 */
const span = (ad) => /** @type {!HTMLSpanElement} */((GEN && globalThis["GEN"])
  ? create(ad, "span")
  : adla(ad));

/**
 * @nosideeffects
 * @param {string} ad
 * @return {!HTMLDivElement}
 */
const div = (ad) => /** @type {!HTMLDivElement} */((GEN && globalThis["GEN"])
  ? create(ad, "div")
  : adla(ad));

/**
 * @param {string} ad
 * @return {!HTMLImageElement}
 */
const img = (ad) => /** @type {!HTMLImageElement} */((GEN && globalThis["GEN"])
  ? create(ad, "img")
  : adla(ad));

/**
 * @param {string} ad
 * @return {!HTMLUListElement}
 */
const ul = (ad) => /** @type {!HTMLUListElement} */((GEN && globalThis["GEN"])
  ? create(ad, "ul")
  : adla(ad));

/**
 * @param {string} ad
 * @return {!HTMLLIElement}
 */
const li = (ad) => /** @type {!HTMLLIElement} */((GEN && globalThis["GEN"])
  ? create(ad, "li")
  : adla(ad));

/**
 * @param {string} ad
 * @return {!HTMLInputElement}
 */
const input = (ad) => /** @type {!HTMLInputElement} */((GEN && globalThis["GEN"])
  ? create(ad, "input")
  : adla(ad));

/**
 * @param {function()} f
 * @param {number} ms
 */
const schedule = (f, ms) => (GEN && globalThis["GEN"]) ? {} : setTimeout(f, ms);

/**
 * @param {function()} f
 */
const run = (f) => (GEN && globalThis["GEN"]) ? {} : f();

export default {
  Lang,
  // Elements
  a,
  button,
  div,
  form,
  img,
  input,
  li,
  span,
  ul,
  // DOM manipulation
  adla,
  adlaGizle,
  adlaGöster,
  adlaGösterGizle,
  gizle,
  göster,
  gösterGizle,
  // Widgets
  bindDropdown,
  düğmeDurdur,
  pencere,
  slideCard,
  // Render
  i18n,
  paradanMetne,
  telefondanMetne,
  // Scheduling
  schedule,
  run,
};
