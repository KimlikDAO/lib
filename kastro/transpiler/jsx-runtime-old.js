import { htmlTag, VoidElementTag } from "../../util/markup/html";
import { LangCode } from "../../util/i18n";
import { getGlobals } from "./pageGlobals";

/** @const {string} */
const Fragment = "";

/**
 * Before we pass the props to a component, we resolve I18nString's to regular
 * strings since the language is fixed at this point.
 *
 * Furthermore, the following props are kastro specific and are removed:
 *   - controls[A-Z]\w*
 *   - on[A-Z]\w*
 *   - instance
 *
 * @param {Record<string, unknown>} props
 * @param {LangCode} lang
*/
const resolveComponentProps = (props, lang) => {
  delete props.instance;
  for (const key in props)
    if (key != "children" && typeof props[key] == "object" && (lang in props[key]))
      props[key] = props[key][lang];
    else if (/^(on[A-Z]|controls[A-Z])/.test(key)) {
      delete props[key];
    }
}

/**
 * We perform additional transformations for the props of a dom node.
 * Arrays are joined with a space which is useful, for instance, for listing
 * styles like `class={["class1", "class2"]}`
 *
 * An exception to this rule is the id prop, where we join with a dot. In kastro
 * automatic dom ids cannot have dots, which are reserved for component nesting.
 * A stateless or stateful component with id say `id` can freely use the dom ids
 * `${id}.*`. Thus one can simply do `id={[id, Css.Subcomponent]}` in jsx
 * expressions to generate unique ids for subcomponents.
 *
 * Further, `nodisplay` and `noshow` are special boolean props that resolve to
 * `display:none` and `opacity:0` respectively.
 *
 * Finally the `modifiesChildren` boolean property is used to determine if we
 * can eagerly start rendering the subtree emanating from the current node. If
 * `modifiesChildren` is true, we wait until the `render()` method is called
 * since before this, the parent is allowed to modify the children props.
 * Otherwise, we eagerly start rendering the subtree and prune the tree when
 * the rendering is finished.
 *
 * @param {Record<string, unknown>} props
 */
const resolveElementProps = (props) => {
  for (const key in props)
    if (key != "children" && Array.isArray(props[key]))
      props[key] = props[key].filter(Boolean).join(key == "id" ? "." : " ");
  if (props.nodisplay) {
    props.style = props.style ? props.style + ";display:none" : "display:none";
    delete props.nodisplay;
  }
  if (props.noshow) {
    props.style = props.style ? props.style + ";opacity:0" : "opacity:0";
    delete props.noshow;
  }
};

const jsx = (name, props = {}) => {
  const globals = getGlobals();
  const nameType = typeof name;
  const isStateful = nameType == "function" && "instance" in props;
  resolveComponentProps(props, globals.Lang);

  if (nameType == "function")
    return isStateful
      ? new name({ ...props, ...globals })
      : name.call({}, { ...props, ...globals });

  if (nameType == "object" && typeof name.render == "function")
    return name.render({ ...props, ...globals });

  let { modifiesChildren, ...prop } = props;

  if (nameType == "object") {
    // This is a kastro fake dom node; treat it as a real dom node
    // by extracting the name and id.
    prop.id = name.id;
    name = name.name;
  }

  const normalizedChildren = [].concat(prop.children || []);
  /** @const {() => Promise<string>} */
  const renderChildren = () => Promise.all(
    normalizedChildren
      .flat()
      .map((child) => {
        if (child == null || typeof child == "boolean") return "";
        if (Object.getPrototypeOf(child) === Object.prototype && (globals.Lang in child))
          child = child[globals.Lang];
        if (typeof child.then == "function")
          return child;
        if (typeof child.render == "function")
          return child.render();
        return child;
      }))
    .then((children) => {
      delete prop.children; // We have rendered the subtree, so we can prune the children
      const { render, ...rest } = prop;
      resolveElementProps(rest);
      return name == Fragment
        ? children.join("")
        : (children.length || !VoidElementTag[name])
          ? htmlTag(name, rest, false) + children.join("") + `</${name}>`
          : htmlTag(name, rest, true);
    });
  /** @const {Promise<string> | null} */
  const renderPromise = modifiesChildren ? null : renderChildren();
  prop.render = () => renderPromise || renderChildren();
  return prop;
}

const jsxs = jsx;

export { Fragment, jsx, jsxs };
