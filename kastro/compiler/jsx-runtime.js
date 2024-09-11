import { KapalıTag, tagYaz } from "../../util/html";
import { getGlobals } from "./pageGlobals";
import { LangCode } from "../crate";
/**
 * @param {!Array<*>} children
 * @param {LangCode} lang
 * @return {string}
 */
const mergeChildren = (children, lang) => children
  .flat()
  .filter((c) => typeof c != "boolean")
  .map((c) => typeof c == "object" && c[lang] ? c[lang] : c)
  .join("");

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
  if (nameType != "function") {
    const { children, ...prop } = props;
    const childStr = mergeChildren([].concat(children || []), globals.Lang);
    if (nameType == "object") {
      prop.id = name.id;
      name = name.name;
    }
    const closed = KapalıTag[name];
    return name == Fragment
      ? childStr
      : childStr || !closed
        ? tagYaz(name, prop, false) + childStr + `</${name}>`
        : tagYaz(name, prop, true);
  }
  return name({ ...props, ...globals });
}

const Fragment = "";

const jsxs = (name, props) => {
  const globals = getGlobals();
  props = resolveProps(props, globals.Lang);

  const nameType = typeof name;
  if (nameType != "function") {
    const { children, ...prop } = props;
    if (nameType == "object") {
      prop.id = name.id;
      name = name.name;
    }
    const childStr = children ? mergeChildren(children, globals.Lang) : "";
    const closed = KapalıTag[name];
    return name == Fragment
      ? childStr
      : childStr || !closed
        ? tagYaz(name, prop, false) + childStr + `</${name}>`
        : tagYaz(name, prop, true);
  }
  return name({ ...props, ...globals });
};

export { Fragment, jsx, jsxs };
