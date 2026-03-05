import { file, spawn, write } from "bun";
import { getExt } from "../../util/paths";
import { CompressedMimes } from "../workers/mimes";
import { BundleReport } from "./bundleReport";
import { AssetHash } from "./hash";

const BundleDir = "build/bundle";
/** @type {Map<string, AssetHash>} */
const NamedAssets = new Map();
/** @type {Map<string, AssetHash>} */
const PiggybackAssets = new Map();
/** @type {Set<string>} */
const HashedAssets = new Set();

/**
 * Returns the BundleReport with the following normalizations
 *  - If a hashedAsset has been aliased by a name, then we remove it from
 *    hashed assets.
 *  - Maps and the Set is converted to Object and Array for serializability.
 *
 * Recall that the names appearing in the report are always compress-extension
 * free. The deployer needs to determine whether an asset will have compressed
 * variants by looking up from the {@link CompressedMimes} table.
 *
 * @return {BundleReport} */
const getReport = () => {
  const hasName = new Set(NamedAssets.values());
  return {
    namedAssets: Object.fromEntries(NamedAssets),
    piggybackAssets: Object.fromEntries(PiggybackAssets),
    hashedAssets: Array.from(HashedAssets.difference(hasName))
  }
};

const reset = () => {
  NamedAssets.clear();
  PiggybackAssets.clear();
  HashedAssets.clear();
};

/**
 * @param {string} source
 * @param {string} destination
 * @param {boolean=} noOverwrite
 * @return {Promise<void>}
 */
const cp = async (source, destination, noOverwrite = false) => {
  if (noOverwrite && await file(destination).exists())
    return;
  return write(destination, file(source));
};

/**
 * Records the asset as piggyback asset at a certain external url. These
 * assets are not written into the bundle, but the deployer needs to ensure
 * the assets are present at the claimed url before the deployment.
 *
 * @param {string} piggybackUrl
 * @param {string} bundleName
 * @return {void}
 */
const piggyback = (piggybackUrl, bundleName) =>
  PiggybackAssets.set(bundleName, `${piggybackUrl}/${bundleName}`);

/**
 * @param {string} aliasedName
 * @param {string} existingName
 * @return {Promise<void>}
 */
const alias = (aliasedName, existingName) => {
  existingName = NamedAssets.get(existingName) || existingName; // Follow 1 step alias chains
  NamedAssets.set(aliasedName, existingName);
  const promises = [cp(`${BundleDir}/${existingName}`, `${BundleDir}/${aliasedName}`)];
  if (!CompressedMimes[getExt(existingName)])
    promises.push(
      cp(`${BundleDir}/${existingName}.br`, `${BundleDir}/${aliasedName}.br`),
      cp(`${BundleDir}/${existingName}.gz`, `${BundleDir}/${aliasedName}.gz`)
    );
  return Promise.all(promises);
}

/**
 * Copies targetFile into the bundle as bundleName; optionally creates .br and .gz.
 * Uses `write` from "bun" for the main copy.
 *
 * @param {string} targetName Source file path (e.g. "build/landing/kdjs-en/landing/Landing.js")
 * @param {string} hashedName Filename in the bundle (e.g. "abc123.js" or "landing-en.js")
 * @return {Promise<void>}
 */
const add = (targetName, hashedName) => {
  HashedAssets.add(hashedName);
  const targetFile = targetName.slice(1);
  const bundlePath = `${BundleDir}/${hashedName}`;
  const promises = [cp(targetFile, bundlePath, true)];
  if (!CompressedMimes[getExt(targetFile)])
    promises.push(
      brotli(targetFile, bundlePath),
      zopfli(targetFile, bundlePath)
    );
  return Promise.all(promises);
};

/**
 * @param {string} inputName The asset to be compressed
 * @param {string} outputName without the .gz extension
 * @return {Promise<string>}
 */
const zopfli = async (inputName, outputName) => {
  const outputNameExt = outputName + ".gz";
  if (await file(outputNameExt).exists())
    return outputNameExt;
  return spawn({
    cmd: [
      "touch",
      "-d", "2026-01-01T00:00:00",
      `${inputName}`
    ],
    stdout: "pipe",
    stderr: "pipe"
  }).exited.then(() => spawn({
    cmd: [
      "zopfli",
      "--force",
      "--best",
      "--i20",
      inputName
    ]
  }).exited
    .then(() => cp(inputName + ".gz", outputNameExt)))
    .then(() => outputNameExt);
};

/**
 * @param {string} inputName The asset to be compressed
 * @param {string} outputName without the .br extension
 * @return {Promise<string>}
 */
const brotli = async (inputName, outputName) => {
  const outputNameExt = outputName + ".br";
  if (await file(outputNameExt).exists())
    return outputNameExt;
  console.info(`brotli: ${outputName}.br <- ${inputName}`);
  return spawn({
    cmd: [
      "brotli",
      "--force",
      "-w", "24",
      "--quality=11",
      "--no-copy-stat",
      `--output=${outputNameExt}`,
      inputName,
    ],
    stdout: "pipe",
    stderr: "pipe"
  }).exited.then(() => outputNameExt);
}

export default {
  add,
  alias,
  piggyback,
  getReport,
  reset,
};
