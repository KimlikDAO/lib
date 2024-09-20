import { KapalıTag, tagYaz } from "../../util/html";
import { LangCode } from "../crate";
import { getGlobals } from "./pageGlobals";
import { Script } from "./script";

/** @const {string} */
const Fragment = "";

/**
 * @param {!Array<*>} children
 * @param {LangCode} lang
 * @return {!Promise<string>}
 */
const mergeChildren = (children, lang) => Promise.all(children
  .flat()
  .filter((c) => typeof c != "boolean")
  .map((c) => (typeof c == "object" && lang in c) ? c[lang] : c))
  .then((children) => children.join(""));

/**
 * @param {!Object} props
 * @param {LangCode} lang
 * @return {!Object}
*/
const resolveProps = (props, lang) => {
  for (const key in props)
    if (key != "children" && typeof props[key] == "object" && props[key][lang])
      props[key] = props[key][lang];
  return props;
}

const jsx = (name, props = {}) => {
  const globals = getGlobals();
  props = resolveProps(props, globals.Lang);

  const nameType = typeof name;
  if (nameType == "function")
    return name({ ...props, ...globals });

  const { children, ...prop } = props;
  if (nameType == "object") {
    prop.id = name.id;
    name = name.name;
  }
  return mergeChildren([].concat(children || []), globals.Lang)
    .then((childStr) => name == Fragment
      ? childStr
      : (childStr || !KapalıTag[name])
        ? tagYaz(name, prop, false) + childStr + `</${name}>`
        : tagYaz(name, prop, true)
    )
}

const jsxs = (name, props) => {
  const globals = getGlobals();
  props = resolveProps(props, globals.Lang);

  const nameType = typeof name;
  if (nameType == "function")
    return name({ ...props, ...globals });

  const { children, ...prop } = props;
  if (nameType == "object") {
    prop.id = name.id;
    name = name.name;
  }
  return mergeChildren(children || [], globals.Lang)
    .then((childStr) => name == Fragment
      ? childStr
      : childStr || !KapalıTag[name]
        ? tagYaz(name, prop, false) + childStr + `</${name}>`
        : tagYaz(name, prop, true)
    );
};

export { Fragment, jsx, jsxs };
