import { readFile } from "node:fs/promises";
import { SAXParser } from "sax";
import { optimize } from "svgo";
import { tagYaz } from "../../util/html";
import { getByKey } from "./hashcache/buildCache";
import SvgoInlineConfig from "./svgoInlineConfig";

const removeGlobalProps = (props) => {
  for (const prop in props)
    if (prop.charCodeAt(0) < 91)
      delete props[prop];
}

/**
 * We optimize the inline svgs regardless of the build mode.
 *
 * @param {!Object<string, *>} props
 * @returns {!Promise<string>}
 */
const compileInlineSvg = ({ src, ...props }) =>
  getByKey("build/" + src, () =>
    getByKey(src, () => readFile(src, "utf-8"))
      .then((svg) => optimize(svg, SvgoInlineConfig).data))
    .then((svg) => {
      removeGlobalProps(props);
      delete props.inline;
      const parser = new SAXParser(true);
      let result = "";
      parser.onopentag = ({ name, attributes }) => {
        if (name === "svg")
          Object.assign(attributes, props);
        result += tagYaz(name, attributes, false);
      };
      parser.ontext = (text) => {
        result += text;
      };
      parser.onclosetag = (tagName) => {
        result += `</${tagName}>`;
      };
      parser.write(svg).close();
      return result;
    });


/**
 * @param {!Object<string, *>} props
 * @return {!Promise<string>}
 */
const Image = (props) => {
  const { inline, src, ...restProps } = props;
  if (inline) {
    if (!src.endsWith(".svg"))
      throw new Error("We only inline svgs; for other formats serving directly is more efficient");
    return compileInlineSvg(props)
  }

  for (const prop in props)
    if (prop[0] === prop[0].toUpperCase())
      delete props[prop];

  return tagYaz("img", props, true);
};

export { Image };
