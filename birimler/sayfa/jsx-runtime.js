import { KapalıTag, tagYaz } from "../../util/html.js";

const jsx = (name, props = {}) => {
  const nameType = typeof name;
  if (nameType != "function") {
    const { children, ...prop } = props;
    const childStr = [].concat(children).join("");
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
    const childStr = children?.join("") || "";
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
