/**
 * @param {!Array<string>} inputs
 * @param {string} isolateDir
 * @param {function(string, boolean):string} preprocessFn
 * @return {!Promise<void>}
 */
const copyToIsolate = (inputs, isolateDir, preprocessFn) => Promise.all(
  inputs.map((input, index) => Bun.file(input)
    .text()
    .then((code) => Bun.write(isolateDir + input, preprocessFn(code, index == 0)))
  )
);

export { copyToIsolate };
