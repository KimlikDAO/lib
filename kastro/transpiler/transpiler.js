import { getComponentProps } from "./componentProps";
import css from "./css";
import { DomIdMapper, GlobalMapper } from "./domIdMapper";
import jsx from "./jsx";

/** @type {!DomIdMapper} */
const IdMapper = new GlobalMapper();

const minifyCss = (content, file) =>
  css.minify(file, content, IdMapper);

const transpileCss = (content, file) =>
  css.transpile(file, content, IdMapper);

const transpileJsx = (content, file, isEntry) =>
  jsx.transpile(isEntry, file, content, IdMapper);

const transpile = (content, file, isEntry) => file.endsWith(".jsx")
  ? jsx.transpile(isEntry, file, content, IdMapper, getComponentProps())
  : css.transpile(file, content, IdMapper)

export {
  minifyCss,
  transpile,
  transpileCss,
  transpileJsx
};
