import { LangCode } from "../../util/i18n";
import { htmlTag, VoidElementTag } from "../../util/markup/html";
import {
  Fragment,
  RuntimeElementType,
  RuntimeNode,
  RuntimeProps,
  RuntimeRenderable
} from "./jsx-runtime";

type RenderGlobals = Record<string, unknown> & {
  Lang?: LangCode;
};

const isPromiseLike = (value: unknown): value is PromiseLike<unknown> =>
  !!value && typeof value == "object" && "then" in value &&
  typeof (value as PromiseLike<unknown>).then == "function";

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  !!value && Object.getPrototypeOf(value) === Object.prototype;

const isRuntimeNode = (value: unknown): value is RuntimeNode =>
  isPlainObject(value) && "name" in value && "props" in value;

const isRenderableObject = (
  value: unknown
): value is { render: (props: RuntimeProps) => unknown } =>
  !!value && typeof value == "object" && "render" in value &&
  typeof (value as { render: (props: RuntimeProps) => unknown }).render == "function";

const isLocalizedObject = (value: unknown, lang?: LangCode): value is Record<string, unknown> =>
  !!lang && isPlainObject(value) && lang in value;

const resolveLocalizedValue = (value: unknown, lang?: LangCode): unknown =>
  isLocalizedObject(value, lang) ? value[lang] : value;

const prepareProps = (props: RuntimeProps, lang?: LangCode): RuntimeProps => {
  const prepared: RuntimeProps = {};
  for (const key in props) {
    if (
      key == "instance" ||
      /^(on[A-Z]|controls[A-Z])/.test(key)
    ) continue;

    prepared[key] = key == "children"
      ? props[key]
      : resolveLocalizedValue(props[key], lang);
  }
  return prepared;
};

const normalizeElementProps = (props: RuntimeProps) => {
  for (const key in props)
    if (key != "children" && Array.isArray(props[key]))
      props[key] = props[key]
        .filter(Boolean)
        .join(key == "id" ? "." : " ");

  if (props.nodisplay) {
    props.style = props.style ? props.style + ";display:none" : "display:none";
    delete props.nodisplay;
  }

  if (props.noshow) {
    props.style = props.style ? props.style + ";opacity:0" : "opacity:0";
    delete props.noshow;
  }
};

const callComponent = (
  name: RuntimeElementType,
  props: RuntimeProps,
  globals: RenderGlobals
): unknown => {
  if (typeof name == "function") {
    const mergedProps = { ...prepareProps(props, globals.Lang), ...globals };
    return Object.prototype.hasOwnProperty.call(props, "instance")
      ? new (name as new (props: RuntimeProps) => unknown)(mergedProps)
      : (name as (props: RuntimeProps) => unknown).call({}, mergedProps);
  }

  if (isRenderableObject(name))
    return name.render({ ...prepareProps(props, globals.Lang), ...globals });

  return null;
};

const renderNode = async (
  node: RuntimeRenderable,
  globals: RenderGlobals
): Promise<string> => {
  if (node == null || typeof node == "boolean")
    return "";

  if (typeof node == "string" || typeof node == "number" || typeof node == "bigint")
    return String(node);

  if (isPromiseLike(node))
    return renderNode(await node as RuntimeRenderable, globals);

  if (Array.isArray(node)) {
    const rendered = await Promise.all(
      node.map((child) => renderNode(child as RuntimeRenderable, globals))
    );
    return rendered.join("");
  }

  const localized = resolveLocalizedValue(node, globals.Lang);
  if (localized !== node)
    return renderNode(localized as RuntimeRenderable, globals);

  if (isRuntimeNode(node)) {
    const { name, props } = node;

    if (typeof name == "function" || isRenderableObject(name))
      return renderNode(callComponent(name, props, globals) as RuntimeRenderable, globals);

    const preparedProps = prepareProps(props, globals.Lang);
    const children = await Promise.all(
      ([] as unknown[]).concat(preparedProps.children ?? [])
        .flat()
        .map((child) => renderNode(child as RuntimeRenderable, globals))
    );

    delete preparedProps.children;
    normalizeElementProps(preparedProps);

    if (name == Fragment)
      return children.join("");

    const tagName = String(name);
    const htmlProps = preparedProps as Record<string, string | number | boolean>;
    return (children.length || !VoidElementTag[tagName])
      ? htmlTag(tagName, htmlProps, false) + children.join("") + `</${tagName}>`
      : htmlTag(tagName, htmlProps, true);
  }

  if (isRenderableObject(node))
    return renderNode(
      (node as { render: (props: RuntimeProps) => unknown }).render(globals) as RuntimeRenderable,
      globals
    );

  return String(node);
};

export {
  renderNode as render
};

export default renderNode;
