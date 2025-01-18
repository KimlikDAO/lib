import { KapalıTag, tagYaz } from "../../util/html";
import { LangCode } from "../../util/i18n";
import { getGlobals } from "./pageGlobals";

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
  delete props.controlsDropdown;

  for (const key in props)
    if (key != "children" && typeof props[key] == "object" && (lang in props[key]))
      props[key] = props[key][lang];
    else if (key.startsWith("data-")) {
      if (key == "data-" + lang) props.children = [props[key]];
      delete props[key];
    } else if (key.startsWith("on") && key.charCodeAt(2) < 91)
      delete props[key];

  if (props.nodisplay) {
    props.style = props.style ? props.style + ";display:none" : "display:none";
    delete props.nodisplay;
  }
  if (props.noshow) {
    props.style = props.style ? props.style + ";opacity:0" : "opacity:0";
    delete props.noshow;
  }
  return props;
}

const mergeArrayProps = (props) => {
  for (const key in props)
    if (Array.isArray(props[key]))
      props[key] = props[key].filter(Boolean).join(" ");
  return props;
};

const jsx = (name, props = {}) => {
  const globals = getGlobals();
  resolveProps(props, globals.Lang);

  const nameType = typeof name;
  if (nameType == "function")
    return name({ ...props, ...globals });

  const { children, ...prop } = props;
  mergeArrayProps(prop);

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
  resolveProps(props, globals.Lang);

  const nameType = typeof name;
  if (nameType == "function")
    return name({ ...props, ...globals });

  const { children, ...prop } = props;
  mergeArrayProps(prop);

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
