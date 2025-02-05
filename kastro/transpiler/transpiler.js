import css from "./css";
import { DomIdMapper, GlobalMapper } from "./domIdMapper";
import jsx from "./jsx";

/** @type {!DomIdMapper} */
const Mapper = new GlobalMapper();

const minifyCss = (content, file) =>
  css.minify(file, content, Mapper);

const transpileCss = (content, file) =>
  css.transpile(file, content, Mapper);

const transpileJsx = (content, file, isEntry) =>
  jsx.transpile(isEntry, file, content, Mapper);

const transpile = (content, file, isEntry) => file.endsWith(".jsx")
  ? jsx.transpile(isEntry, file, content, Mapper)
  : css.transpile(file, content, Mapper)

export {
  minifyCss,
  transpile,
  transpileCss,
  transpileJsx
};
