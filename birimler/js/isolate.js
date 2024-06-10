import { Params } from "./params";

/**
 * @param {!Params} params
 * @param {function(string, boolean):string} preprocessFn
 * @return {!Promise<void>}
 */
const copyToIsolate = (params, preprocessFn) => Promise.all(
  params["inputs"].map((input, index) => Bun.file(input)
    .text()
    .then((code) => Bun.write(params["isolateDir"] + input, preprocessFn(code, index == 0)))
  )
);

export { copyToIsolate };
