import { chunk } from "../../util/arrays";
import { ApiV4 } from "./api";

/**
 * @param {string} crateName
 * @param {Record<string, unknown>} secrets
 * @param {string[]} namedAssets
 */
const purge = async (crateName, secrets, namedAssets) => {
  const { HostUrl } = await import(crateName);
  const { zoneId, token } = secrets.CloudflareAuth;
  namedAssets.push("");
  /** @const {string[][]} */
  const batches = chunk(namedAssets, 30);
  for (let i = 0; i < batches.length; ++i) {
    console.log(`Purging batch ${i + 1} of ${batches.length}:`, batches[i]);
    /** @const {string} */
    const body = JSON.stringify({ files: batches[i].map((asset) => `${HostUrl}/${asset}`) });
    const res = await fetch(`${ApiV4}/zones/${zoneId}/purge_cache`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "authorization": `Bearer ${token}`,
      },
      body
    });
    const { success } = await res.json();
    console.log(success ? "Success" : "Failed");
  }
}

export default { purge };
