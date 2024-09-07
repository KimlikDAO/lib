import { tagYaz } from "../../util/html.js";

const jsx = (name, props = {}) => {
  const nameType = typeof name;
  if (nameType != "function") {
    const { children, ...prop } = props;
    const childStr = [].concat(children).join("");
    if (nameType == "object") {
      prop.id = name.id;
      name = name.name;
    }
    return name == Fragment
      ? children
      : tagYaz(name, prop, false) + childStr + `</${name}>`;
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
    return name == Fragment
      ? childStr
      : tagYaz(name, prop, false) + childStr + `</${name}>`;
  }
  return name(props);
};

export { Fragment, jsx, jsxs };
