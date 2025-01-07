import { ApiV4, Auth } from "./api";

/**
 * @param {Auth} auth
 * @param {string} name
 * @param {string} code
 * @param {!Array<{
*   name: string,
*   namespace_id: string
* }>=} kvBindings
* @return {!Promise<cloudflare.Response>}
*/
const upload = (auth, name, code, kvBindings) => {
  /** @const {string} */
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  /** @dict */
  const metadata = {
    "main_module": "a.js",
    "compatibility_date": yesterday
  };
  if (kvBindings && kvBindings.length) {
    for (const kv of kvBindings)
      kv["type"] = "kv_namespace";
    metadata["bindings"] = kvBindings;
  }
  /** @const {!FormData} */
  const form = new FormData();
  form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
  form.append("a.js", new File([code], "a.js", { type: "application/javascript+module;charset=utf-8" }));
  return fetch(`${ApiV4}/accounts/${auth.account}/workers/scripts/${name}`, {
    method: "PUT",
    headers: { "authorization": `Bearer ${auth.apiToken}` },
    body: form
  }).then((res) => res.json());
};

/**
* @param {Auth} auth
* @param {string} name
* @param {string} url
* @return {!Promise<cloudflare.Response>}
*/
const bind = (auth, name, url) => fetch(`${ApiV4}/accounts/${auth.account}/workers/domains`, {
  method: "PUT",
  headers: {
    "authorization": `Bearer ${auth.apiToken}`,
    "content-type": "application/json"
  },
  body: JSON.stringify({
    "environment": "production",
    "hostname": url,
    "service": name
  })
}).then((res) => res.json());

/**
 * @param {Auth} auth
 * @param {string} name
 * @return {!Promise<cloudflare.Response>}
 */
const enableWorkersDev = (auth, name) => fetch(`${ApiV4}/accounts/${auth.account}/workers/services/${name}/environments/production/subdomain`, {
  method: "POST",
  headers: {
    "authorization": `Bearer ${auth.apiToken}`,
    "content-type": "application/json"
  },
  body: JSON.stringify({ enabled: true })
}).then(res => res.json());

const workers = {
  upload,
  bind,
  /**
   * Deletes a worker by name.
   *
   * @param {Auth} auth
   * @param {string} name 
   * @return {!Promise<cloudflare.Response>}
   */
  delete(auth, name) {
    return fetch(`${ApiV4}/accounts/${auth.account}/workers/scripts/${name}`, {
      method: "DELETE",
      headers: { "authorization": `Bearer ${auth.apiToken}` }
    }).then((res) => res.json());
  },
  enableWorkersDev,
};

export default workers;
