/** @enum {string} */
const LangCode = {
  EN: "en",
  TR: "tr",
  BG: "bg",
  KZ: "kz",
};

/**
 * Since {@link dom} fixed the LangCode, {@link dom.i18n()}
 * will resolve this to a `string`.
 *
 * @typedef {Record<LangCode, string>}
 */
const I18nString = {};

/**
 * Since {@link dom} fixed the LangCode, {@link dom.i18n()}
 * will resolve this to a `string[]`.
 *
 * @typedef {Record<LangCode, string[]>}
 */
const I18nStrings = {};

/**
 * `Localizable` cannot be resolved at compile time and typically used
 * only on render time code.
 *
 * @typedef {Record<LangCode, string> | string}
 */
const Localizable = {};

/**
 * @param {string[]} strings
 * @param {...(Localizable)} values
 * @return {I18nString}
 */
const i18n = (strings, ...values) => {
  /** @const {I18nString} */
  const result = {};
  /** @const {I18nString} */
  const firstI18n = /** @type {I18nString} */(values.find((v) => typeof v === "object") || { [LangCode.EN]: "" });
  /** @const {LangCode[]} */
  const langs = Object.keys(firstI18n);

  for (const lang of langs)
    result[lang] = strings.reduce(
      /**
       * @param {string} acc 
       * @param {string} str 
       * @param {number} i 
       * @return {string}
       */
      (acc, str, i) => {
        /** @const {Localizable} */
        const value = values[i] || "";
        return acc + str + (typeof value === "object" ? value[lang] : value);
      }, "");

  return result;
};

export {
  I18nString,
  I18nStrings,
  LangCode,
  Localizable,
  i18n
};
