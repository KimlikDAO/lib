import { readdir, readFile } from "node:fs/promises";
import compiler from "../compiler/compiler";
import { CompressedMimes } from "../workers/mimes";
import workers from "./workers";

/** @const {!Array<string>} */
const Extensions = ['', '.br', '.gz'];

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

const deploy = (crateName, secrets, namedAssets) => {
  /** @const {string} */
  const crateDir = "build/crate/";
  return Promise.all([
    compiler.buildTarget("/build/bundledPageWorker.js", {
      dynamicDeps: true,
      src: "lib/kastro/cloudflare/bundledPageWorker.js",
      BuildMode: compiler.BuildMode.Compiled
    }),
    readdir(crateDir)
      .then((files) => Promise.all(files.map((file) => readFile(crateDir + "/" + file)
        .then((content) => [file, content])))
        .then(Object.fromEntries))
  ]).then(([{ content }, files]) =>
    workers.upload(secrets.CloudflareAuth, "dapp", content.buffer, [], files));
}

export {
  deploy
};
