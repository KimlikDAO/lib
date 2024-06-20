import { fileURLToPath } from "node:url";
import { getDir } from "../util/paths";

const PACKAGE_EXTERNS = "node_modules/@kimlikdao/kdjs/externs/";

const translateToLocal = (packageExtern) => {
  if (!packageExtern.startsWith(PACKAGE_EXTERNS)) throw 'Has to start with "PACKAGE_EXTERNS"';
  return `/${getDir(fileURLToPath(import.meta.url))}/externs/${packageExtern.slice(PACKAGE_EXTERNS.length)}`;
}

export {
  PACKAGE_EXTERNS,
  translateToLocal
};
