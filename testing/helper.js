/**
 * @param {string} code
 * @param {string=} path
 * @return {!Object}
 */
const importCode = (code, path) => import(
  URL.createObjectURL(new File([code], path, { type: "application/javascript+module" })));

export { importCode };
