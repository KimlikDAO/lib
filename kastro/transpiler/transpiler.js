import css from "./css";
import { DomIdMapper, GlobalMapper } from "./domIdMapper";
import jsx from "./jsx";

/** @type {!DomIdMapper} */
const Mapper = new GlobalMapper();

const minifyCss = (content, file) =>
  css.minifyCss(file, content, Mapper);

const transpileCss = (content, file) =>
  css.transpileCss(file, content, Mapper);

const transpileJsx = (content, file, isEntry) =>
  jsx.transpileJsx(isEntry, file, content, Mapper);

const transpile = (content, file, isEntry) => file.endsWith(".jsx")
  ? transpileJsx(content, file, isEntry)
  : transpileCss(content, file);

export {
  minifyCss,
  transpile,
  transpileCss,
  transpileJsx
};
