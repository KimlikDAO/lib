import { readFile, rm, writeFile } from "node:fs/promises";
import { base64, base64ten } from "../../util/çevir";

export default {
  read(targetName) {
    return readFile(`${targetName.slice(1)}.marker`, "utf8")
      .then((markerContent) => {
        const marker = JSON.parse(markerContent);
        marker.contentHash = base64ten(marker.contentHash);
        if (marker.depHash)
          marker.depHash = base64ten(marker.depHash);
        return marker;
      });
  },

  remove(targetName) {
    return rm(`${targetName.slice(1)}.marker`, { force: true });
  },

  /**
   * @param {string} targetName 
   * @param {CacheEntry} entry 
   */
  write(targetName, entry) {
    const marker = { contentHash: base64(entry.contentHash) };
    if (entry.depHash) marker.depHash = base64(entry.depHash);
    return writeFile(`${targetName.slice(1)}.marker`, JSON.stringify(marker))
      .then(() => entry)
  }
};
