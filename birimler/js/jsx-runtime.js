import { tagYaz } from "../util/html.js";

export const jsx = (type, props = {}) => {
  // Extract children from props, if present
  const children = (props && props.children) || [];
  const childrenString = Array.isArray(children)
    ? children.map(child =>
      typeof child === "object" ? jsx(child) : child
    ).join('')
    : children;

  if (typeof type === "string") {
    // Remove children from props as it's already handled
    const { children, ...attributes } = props;
    return type.toLowerCase() == "br"
      ? "<br>"
      : tagYaz(type, attributes, false) + childrenString + `</${type}>`;
  } else
    return type(props);
}
