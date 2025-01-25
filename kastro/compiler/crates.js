import { LangCode } from "../../util/i18n";

/**
 * @param {!Object} crate
 * @return {!Array<LangCode>}
 */
const getCrateLangs = (crate) => crate.Page
  ? crate.Languages : Object.keys(Object.values(crate.Page)[0]);

/**
 * @param {!Object<string, PageTarget>} map
 * @param {!Object} crate
 * @param {compiler.BuildMode} buildMode
 * @param {LangCode} lang
 * @return {!Object<string, PageTarget>} Returns a map from routes to page props.
 */
const addPageTargets = (map, { Page, CodebaseLang, Entry }, buildMode, lang) => {
  for (const name of Page) {
    const dirName = Entry == name ? name.toLowerCase() : Page[name][CodebaseLang];
    const pageProps = {
      BuildMode: buildMode,
      Lang: lang,
      CodebaseLang,
      Route: { ...Page[name] },
      bundleName: Page[name][lang],
      targetName: `/build/${dirName}/page-${lang}.html`,
    };
    delete pageProps.Route[lang];
    map[`/${pageProps.bundleName}`] = pageProps;
  }
};

/**
 * @param {!Object} crate 
 * @param {compiler.BuildMode} buildMode
 * @param {LangCode=} lang
 * @return {!Object<string, PageTarget>}
 */
const getPageTargets = (crate, buildMode, lang) => {
  const map = {};
  const langs = lang ? [lang] : getCrateLangs(crate);
  for (const lang of langs)
    addPageTargets(map, crate, buildMode, lang);
  if (lang)
    map["/"] = map[`/${crate.Entry[crate.CodebaseLang]}`];
  return map;
}

export default {
  getLanguages,
  addPageTargets,
  getPageTargets,
};
