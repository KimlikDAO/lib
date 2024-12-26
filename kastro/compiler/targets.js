import { compile } from "../../kdjs/compile";
import { hashAndCompressFile } from "./compression";

/**
 * @param {!Object<string, *>} props
 * @param {!Object<string, *>} globals
 * @return {!Promise<string>} the generated script element
 */
const compileScript = (props, globals) => {
  const entry = props.src.slice(1);
  const output = `build/${entry.slice(0, -3)}-${globals.dil}.js`;

  return compile({
    entry,
    output,
    loose: "data-loose" in props ? true : false,
    globals
  }).then(() => hashAndCompressFile(output))
    .then((compressedName) => `<script src=${compressedName} type="module">`)
}


export { compileScript, generateStylesheet };
