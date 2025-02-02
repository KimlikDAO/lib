
/**
 * @param {string} fileName
 * @return {string} directory of the fileName
 */
const getDir = (fileName) => fileName.substring(0, fileName.lastIndexOf("/"));

/**
 * @param {string} fileName
 * @param {string} orElse
 * @return {string} the extension
 */
const getExt = (fileName, orElse = "") => {
  const dot = fileName.lastIndexOf(".") + 1;
  return dot == 0 ? orElse : fileName.slice(dot);
}

/**
 * @param {string} fileName
 * @return {!Array<string>} [path, extension] without the dot
 */
const splitFullExt = (fileName) => {
  const slash = fileName.lastIndexOf("/");
  const dot = fileName.indexOf(".", slash);
  const ext = dot < slash ? fileName.length : dot;
  return [fileName.slice(0, ext), fileName.slice(ext + 1)];
}

/**
 * @param {string} basePath
 * @param {string} subPath
 * @return {string} combined path
 */
const combine = (basePath, subPath) => {
  /** @const {!Array<string>} */
  const parts = basePath.split("/").concat(subPath.split("/"));
  /** @type {number} */
  let j = 0;
  for (let i = 0; i < parts.length; ++i) {
    const /** string */ part = parts[i];
    if (part == ".." && j > 0 && parts[j - 1] != "..") --j;
    else if (part !== "." && part !== "")
      parts[j++] = part;
  }
  return parts.slice(0, j).join('/');
}

const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

export {
  capitalize,
  getDir,
  getExt,
  combine,
  splitFullExt
};
