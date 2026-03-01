import { LangCode } from "../util/i18n";

/**
 * @typedef {{
 *   targetName?: string,
 *   BuildMode?: number,
 *   Lang?: LangCode,
 *   CodebaseLang?: LangCode,
 *   Route?: Record<LangCode, string>,
 *   bundleName?: string,
 *   bundleHashed?: boolean,
 *   piggyback?: string,
 *   alwaysBuild?: boolean,
 *   dynamicDeps?: boolean,
 *   crate?: unknown,
 * }}
 */
const Props = {};

const removeGlobalProps = (props) => {
  for (const prop in props)
    if (prop.charCodeAt(0) < 91)
      delete props[prop];
}

const filterGlobalProps = (props) => {
  const result = {};
  for (const prop in props)
    if (prop.charCodeAt(0) < 91)
      result[prop] = props[prop];
  return result;
}

const filterOutGlobalProps = (props) => {
  const result = {};
  for (const prop in props)
    if (prop.charCodeAt(0) >= 91)
      result[prop] = props[prop];
  return result;
}

export {
  Props,
  filterGlobalProps,
  filterOutGlobalProps,
  removeGlobalProps
};
