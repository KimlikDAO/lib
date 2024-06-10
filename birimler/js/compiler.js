import { bigintPass } from "./bigintPass";
import { compile } from "./compile";
import { copyToIsolate } from "./isolate";
import { getParams, Params } from "./params";

/**
 * @const
 * @type {!Params}
 */
const params = getParams();

params["inputs"].map((input, index) => Bun.file(input));

/** @const {!Map<string, !Array<string>>} */
const importMap = new Map();

const preprocessFn = (code, isEntryPoint) => isEntryPoint
  ? code.replace("export default", "globalThis['ExportDefault']=")
  : code;

const postprocessFn = (code) => bigintPass(
  code.replace("globalThis.ExportDefault=", "export default"));

await copyToIsolate(params, preprocessFn);
await compile(params, postprocessFn);
