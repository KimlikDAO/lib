import { CompressedMimes } from "../workers/mimes";

/** @const {string} */
const CloudflareV4 = "https://api.cloudflare.com/client/v4";

/** @const {!Array<string>} */
const Extensions = ['', '.br', '.gz'];

/**
 * @typedef {{
 *   accountId: string,
 *   token: string
 * }}
 */
const Auth = {};

/**
 * @param {!Array<string>} assets
 * @return {!Set<string>}
 */
const getFileSet = (assets) => {
  /** @const {!Array<string>} */
  const files = [];
  for (const asset of assets) {
    const idx = asset.lastIndexOf('.');
    if (idx != -1 && CompressedMimes[asset.slice(idx + 1)])
      files.push(asset)
    else
      files.push(...Extensions.map((e) => asset + e));
  }
  return new Set(files);
}

/**
 * Gets existing keys from CloudFlare KV.
 *
 * @return {!Promise<!Set<string>>}
 */
export const getExisting = (auth, namespaceId) =>
  fetch(`${CloudflareV4}/accounts/${auth.accountId}/storage/kv/namespaces/${namespaceId}/keys`, {
    headers: { 'Authorization': 'Bearer ' + auth.token }
  }).then((res) => res.json())
    .then((data) => new Set(data.result.map(x => x.name)))


const uploadAssets = async (auth, namespaceId, namedAssets) => {
  const existing = await getExisting(auth, namespaceId);
  const namedFiles = getFileSet(namedAssets);

  /** @const {!Array<string>} */
  const staticFiles = await readdir("build", { withFileTypes: true })
    .then((files) => files
      .filter((file) => file.isFile() && !existing.has(file.name) && !namedFiles.has(file.name))
      .map((file) => file.name)
    );

  console.log("🌀 Uploading static files:", staticFiles);
}

/**
 * @param {Auth} auth
 * @param {string} name
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
  return fetch(`${CloudflareV4}/accounts/${auth.accountId}/workers/scripts/${name}`, {
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
const bindWorker = (auth, name, url) => fetch(`${CloudflareV4}/accounts/${auth.accountId}/workers/domains`, {
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

const deployCrate = (crateName) => import(crateName)
  .then((crate) => {

  })

export {
  Auth,
  bindWorker,
  uploadWorker
};
