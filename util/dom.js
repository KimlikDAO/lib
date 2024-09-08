/**
 * @define {boolean}
 */
const TR = true;

/** @define {boolean} */
const GEN = true;

/**
 * @noinline
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
 * @param {Element} düğme
 * @param {Element} menü
 */
const menüYarat = (düğme, menü) => {
  const kapat = (event) => {
    düğme.classList.remove("sel");
    gizle(menü);
    window.onclick = null;
  }
  düğme.onclick = (event) => {
    düğme.classList.add("sel");
    menü.style.display = "";
    let f = window.onclick;
    if (f) f(event);
    if (f !== kapat) window.onclick = kapat;
    event.stopPropagation();
  }
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
 * @param {number} para
 * @return {string} metin olarak yazılmış para miktarı
 */
const paradanMetne = (para) => TR
  ? ("" + (para / 1_000_000)).replace(".", ",")
  : ("" + (para / 1_000_000))

/**
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
 * @return {!HTMLSpanElement}
 */
const span = (ad) => /** @type {!HTMLSpanElement} */((GEN && globalThis["GEN"])
  ? create(ad, "span")
  : adla(ad));

/**
 * @param {string} ad
 * @return {!HTMLDivElement}
 */
const div = (ad) => /** @type {!HTMLDivElement} */((GEN && globalThis["GEN"])
  ? create(ad, "div")
  : adla(ad));

export default {
  a,
  adla,
  adlaGizle,
  adlaGöster,
  adlaGösterGizle,
  button,
  div,
  düğmeDurdur,
  gizle,
  göster,
  gösterGizle,
  menüYarat,
  paradanMetne,
  pencere,
  span,
  telefondanMetne,
  TR
};
