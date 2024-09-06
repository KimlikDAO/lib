import { tagYaz } from "../../util/html.js";

const jsx = (tag, props = {}) => {
  if (typeof tag == "function")
    return tag(props);

  if (typeof tag === "string") {
    const { children, ...attributes } = props;
    return tag.toLowerCase() == "br"
      ? Promise.resolve("<br>")
      : Promise.all([].concat(children)
        .map((child) => typeof child === "object" && "type" in child
          ? jsx(child.type, child.props) : child))
        .then((renderedChildren) =>
          tagYaz(tag, attributes, false) + renderedChildren.join("") + `</${tag}>`);
  }
  console.log("other type", tag, props);
}

export { jsx };
