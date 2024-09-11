
/**
 * @typedef {{
 *   accountId: string,
 *   token: string
 * }}
 */
const Auth = {};

/**
 * @param {Auth} auth
 * @param {string} name
 * @param {string} url
 * @param {string} code
 * @param {!Array<{
 *   name: string,
 *   namespace_id: string
 * }>=} kvBindings
 * @return {!Promise<*>}
 */
const uploadWorker = (auth, name, code, kvBindings) => {
  /** @const {string} */
  const yesterday = new Date(Date.now() - 86400000)
    .toISOString().split('T')[0];
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
  return fetch(`https://api.cloudflare.com/client/v4/accounts/${auth.accountId}/workers/scripts/${name}`, {
    method: "PUT",
    headers: { "authorization": `Bearer ${auth.token}` },
    body: form
  }).then((res) => res.json());
};

/**
 * @param {Auth} auth
 * @param {string} name
 * @param {string} url
 */
const bindWorker = (auth, name, url) => fetch(
  `https://api.cloudflare.com/client/v4/accounts/${auth.accountId}/workers/domains`, {
  method: "PUT",
  headers: {
    "authorization": `Bearer ${auth.token}`,
    "content-type": "application/json"
  },
  body: JSON.stringify({
    "environment": "production",
    "hostname": url,
    "service": name
  })
}).then((res) => res.json());

export {
  Auth,
  bindWorker,
  uploadWorker
};
