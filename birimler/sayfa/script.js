import { compile } from "../../kdjs/compile";
import { define } from "../defines";
import { hashAndCompress } from "../hashcache/compression";

const transformChainData = (chains) => chains.split("|")
  .map(segment => segment.split(',')[0])
  .join("|");

/**
 * @param {!Object<string, string>} attribs
 * @param {!Object<string, string>} scope
 * @return {!Promise<string>}
 */
const generateScript = (attribs, scope) => {
  const entry = attribs.src.slice(1);
  const output = `build/${entry.slice(0, -3)}-${scope.dil}.js`;

  return compile({
    entry,
    output,
    loose: "data-loose" in attribs ? true : false,
    define: [
      define("lib/util/dom", "TR", scope.dil = "tr" ? "true" : "false"),
      define("birim/dil/birim", "KonumTR", scope.tr),
      define("birim/dil/birim", "KonumEN", scope.en),
      define("birim/cüzdan/birim", "Chains", transformChainData(scope.Chains)),
      define("birim/cüzdan/birim", "DefaultChain", scope.DefaultChain)
    ]
  }).then(() => hashAndCompress(output))
    .then((compressedName) => `<script src=${compressedName} type="module">`)
}

export { generateScript };
