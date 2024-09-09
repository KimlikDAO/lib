import { KapalıTag, tagYaz } from "../../util/html.js";

/**
 * @param {!Array<*>} children
 * @return {string}
 */
const mergeChildren = (children) => children
  .flat()
  .filter((c) => typeof c != "boolean")
  .join("");

const jsx = (name, props = {}) => {
  const nameType = typeof name;
  if (nameType != "function") {
    const { children, ...prop } = props;
    const childStr = mergeChildren([].concat(children || []));
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
  return name(props);
}

const Fragment = "";

const jsxs = (name, props) => {
  const nameType = typeof name;
  if (nameType != "function") {
    const { children, ...prop } = props;
    if (nameType == "object") {
      prop.id = name.id;
      name = name.name;
    }
    const childStr = children ? mergeChildren(children) : "";
    const closed = KapalıTag[name];
    return name == Fragment
      ? childStr
      : childStr || !closed
        ? tagYaz(name, prop, false) + childStr + `</${name}>`
        : tagYaz(name, prop, true);
  }
  return name(props);
};

export { Fragment, jsx, jsxs };
