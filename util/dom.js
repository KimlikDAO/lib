import { LangCode } from "./i18n";

/** @define {boolean} */
const GEN = true;

/** @define {LangCode} */
const Lang = LangCode.EN;

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
const byId = (ad) => /** @type {!Element} */(document.getElementById(ad));

/**
 * @noinline
 * @param {Element} element
 */
const hide = (element) => element.style.display = "none";

/**
 * @noinline
 * @param {Element} element
 * @param {boolean=} show
 */
const show = (element, show = true) => element.style.display = show ? "" : "none";

/**
 * @noinline
 * @param {string} id
 */
const hideById = (id) => byId(id).style.display = "none";;

/**
 * @param {string} id
 * @param {boolean=} isVisible
 */
const showById = (id, isVisible) => show(byId(id), isVisible);

/** @const */
const text = {
  /**
   * @param {!Element} element
   * @param {string} text
   * @return {string}
   */
  update: (element, text) => /** @type {!Text} */(element.firstChild).data = text,

  /**
   * @param {!Element} element
   * @param {string=} text
   */
  setPreserve: (element, text) => {
    /** @const {!Text} */
    const textNode = /** @type {!Text} */(element.firstChild);
    /** @const {string|undefined} */
    const preserved = element["o"];
    if (!preserved) {
      if (!text) return;
      element["o"] = textNode.data;
    }
    textNode.data = /** @type {string} */(text || preserved);
  },

  /**
   * @param {!Element} element
   * @param {string} text
   */
  appendPreserve: (element, text) => {
    /** @const {!Text} */
    const textNode = /** @type {!Text} */(element.firstChild);
    /** @type {string|undefined} */
    let preserved = element["o"];
    if (!preserved)
      element["o"] = preserved = textNode.data;
    textNode.data = preserved + text;
  }
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
const renderCurrency = (para) => (para / 1_000_000).toLocaleString(Lang);

/**
 * @nosideeffects
 * @param {string} telefon
 * @return {string} formatlanmış telefon numarası
 */
const renderPhone = (telefon) =>
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
  : byId(ad));

/**
 * @param {string} ad
 * @return {!HTMLButtonElement}
 */
const button = (ad) => /** @type {!HTMLButtonElement} */((GEN && globalThis["GEN"])
  ? create(ad, "button")
  : byId(ad));

/**
 * @param {string} ad
 * @return {!HTMLFormElement}
 */
const form = (ad) => /** @type {!HTMLFormElement} */((GEN && globalThis["GEN"])
  ? create(ad, "form")
  : byId(ad));

/**
 * @param {string} ad
 * @return {!HTMLSpanElement}
 */
const span = (ad) => /** @type {!HTMLSpanElement} */((GEN && globalThis["GEN"])
  ? create(ad, "span")
  : byId(ad));

/**
 * @nosideeffects
 * @param {string} ad
 * @return {!HTMLDivElement}
 */
const div = (ad) => /** @type {!HTMLDivElement} */((GEN && globalThis["GEN"])
  ? create(ad, "div")
  : byId(ad));

/**
 * @param {string} ad
 * @return {!HTMLImageElement}
 */
const img = (ad) => /** @type {!HTMLImageElement} */((GEN && globalThis["GEN"])
  ? create(ad, "img")
  : byId(ad));

/**
 * @param {string} ad
 * @return {!HTMLUListElement}
 */
const ul = (ad) => /** @type {!HTMLUListElement} */((GEN && globalThis["GEN"])
  ? create(ad, "ul")
  : byId(ad));

/**
 * @param {string} domId
 * @return {!HTMLLIElement}
 */
const li = (domId) => /** @type {!HTMLLIElement} */((GEN && globalThis["GEN"])
  ? create(domId, "li")
  : byId(domId));

/**
 * @param {string} domId
 * @return {!HTMLTableCellElement}
 */
const td = (domId) => /** @type {!HTMLTableCellElement} */((GEN && globalThis["GEN"])
  ? create(domId, "td")
  : byId(domId));

/**
 * @param {string} ad
 * @return {!HTMLInputElement}
 */
const input = (ad) => /** @type {!HTMLInputElement} */((GEN && globalThis["GEN"])
  ? create(ad, "input")
  : byId(ad));

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
  GEN,
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
  td,
  // DOM manipulation
  byId,
  showById,
  hideById,
  show,
  hide,
  text,
  // Widgets
  bindDropdown,
  pencere,
  slideCard,
  // Render
  i18n,
  renderCurrency,
  renderPhone,
  // Scheduling
  schedule,
  run,
};
