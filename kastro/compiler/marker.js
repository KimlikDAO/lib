import { readFile, rm, writeFile } from "node:fs/promises";
import base64 from "../../util/base64";
import { Marker } from "./marker.d";
import { Target } from "./target";

export default {
  /**
   * @param {string} targetName
   * @return {Promise<Target>}
   */
  read(targetName) {
    return readFile(`${targetName.slice(1)}.marker`, "utf8")
      .then((markerContent) => {
        const marker = /** @type {Marker} */(JSON.parse(markerContent));
        /** @type {Target} */
        const target = {
          contentHash: base64.toBytes(marker.contentHash),
        };
        if (marker.depHash)
          target.depHash = base64.toBytes(marker.depHash);
        return target;
      });
  },

  /**
   * @param {string} targetName
   * @return {Promise<void>}
   */
  remove(targetName) {
    return rm(`${targetName.slice(1)}.marker`, { force: true });
  },

  /**
   * @param {string} targetName 
   * @param {Target} entry
   * @return {Promise<Target>}
   */
  write(targetName, target) {
    const marker = /** @type {Marker} */({
      contentHash: base64.from(target.contentHash)
    });
    if (target.depHash)
      marker.depHash = base64.from(target.depHash);
    return writeFile(`${targetName.slice(1)}.marker`, JSON.stringify(marker))
      .then(() => target)
  }
};
