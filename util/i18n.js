

/** @enum {string} */
const LangCode = {
  EN: "en",
  TR: "tr",
  BG: "bg",
  KZ: "kz",
};

/**
 * @typedef {!Object<LangCode, string>}
 */
const I18nString = {};

/**
 * @typedef {!Object<LangCode, !Array<string>>}
 */
const I18nStrings = {};

/**
 * @param {!Array<string>} strings
 * @param {...(I18nString|string)} values
 * @return {I18nString}
 */
const i18n = (strings, ...values) => {
  /** @const {I18nString} */
  const result = {};
  /** @const {I18nString} */
  const firstI18n = /** @type {I18nString} */(values.find((v) => typeof v === "object") || { [LangCode.EN]: "" });
  /** @const {!Array<LangCode>} */
  const langs = Object.keys(firstI18n);

  for (const lang of langs) {
    result[lang] = strings.reduce((acc, str, i) => {
      const value = values[i] || "";
      return acc + str + (typeof value === "object" ? value[lang] : value);
    }, "");
  }
  return result;
};

export {
  I18nString,
  I18nStrings,
  LangCode,
  i18n
};
