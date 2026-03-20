import { file, spawn, write } from "bun";
import { getExt } from "../../util/paths";
import { CompressedMimes } from "../workers/mimes";
import { BundleName, BundleReport, GivenName, HashedName } from "./bundleReport";

const BundleDir = "build/bundle";

const NamedAssets = new Map<GivenName, HashedName>();
const PiggybackAssets = new Map<string, BundleName>();
const HashedAssets = new Set<HashedName>();

/**
 * Returns the BundleReport with the following normalizations
 *  - If a hashedAsset has been aliased by a name, then we remove it from
 *    hashed assets.
 *  - Maps and the Set is converted to Object and Array for serializability.
 *
 * Recall that the names appearing in the report are always compress-extension
 * free. The deployer needs to determine whether an asset will have compressed
 * variants by looking up from the {@link CompressedMimes} table.
 */
const getReport = (): BundleReport => {
  const hasName = new Set(NamedAssets.values());
  return {
    namedAssets: Object.fromEntries(NamedAssets),
    piggybackAssets: Object.fromEntries(PiggybackAssets),
    hashedAssets: Array.from(HashedAssets).filter((asset) => !hasName.has(asset)),
  };
};

const reset = (): void => {
  NamedAssets.clear();
  PiggybackAssets.clear();
  HashedAssets.clear();
};

const cp = async (
  source: string,
  destination: string,
  noOverwrite = false,
): Promise<number> => {
  if (noOverwrite && await file(destination).exists())
    return 0;
  return write(destination, file(source));
};

/**
 * Records the asset as piggyback asset at a certain external url. These
 * assets are not written into the bundle, but the deployer needs to ensure
 * the assets are present at the claimed url before the deployment.
 */
const piggyback = (piggybackUrl: string, bundleName: BundleName): void => {
  PiggybackAssets.set(bundleName, `${piggybackUrl}/${bundleName}`);
};

const alias = async (
  aliasedName: BundleName,
  existingName: BundleName,
): Promise<void> => {
  // We assume that existingName must already be in the bundle. In this case
  // the following expression results in a HashedName.
  const hashedName = NamedAssets.get(existingName) || existingName as HashedName;
  NamedAssets.set(aliasedName, hashedName);
  const promises: Promise<number>[] = [
    cp(`${BundleDir}/${hashedName}`, `${BundleDir}/${aliasedName}`)
  ];
  if (!CompressedMimes[getExt(hashedName)])
    promises.push(
      cp(`${BundleDir}/${hashedName}.br`, `${BundleDir}/${aliasedName}.br`),
      cp(`${BundleDir}/${hashedName}.gz`, `${BundleDir}/${aliasedName}.gz`),
    );
  await Promise.all(promises);
};

/**
 * Copies targetFile into the bundle as bundleName; optionally creates .br and .gz.
 * Uses `write` from "bun" for the main copy.
 */
const add = async (
  targetName: string,
  hashedName: HashedName,
): Promise<void> => {
  HashedAssets.add(hashedName);
  const targetFile = targetName.slice(1);
  const bundlePath = `${BundleDir}/${hashedName}`;
  const promises: Promise<unknown>[] = [cp(targetFile, bundlePath, true)];
  if (!CompressedMimes[getExt(targetFile)])
    promises.push(
      brotli(targetFile, bundlePath),
      zopfli(targetFile, bundlePath),
    );
  await Promise.all(promises);
};

const zopfli = async (inputName: string, outputName: string): Promise<string> => {
  const outputNameExt = outputName + ".gz";
  if (await file(outputNameExt).exists())
    return outputNameExt;
  await spawn({
    cmd: [
      "touch",
      "-d", "2026-01-01T00:00:00",
      inputName,
    ],
    stdout: "pipe",
    stderr: "pipe",
  }).exited;
  await spawn({
    cmd: [
      "zopfli",
      "--force",
      "--best",
      "--i20",
      inputName,
    ]
  }).exited;
  await cp(inputName + ".gz", outputNameExt);
  return outputNameExt;
};

const brotli = async (inputName: string, outputName: string): Promise<string> => {
  const outputNameExt = outputName + ".br";
  if (await file(outputNameExt).exists())
    return outputNameExt;
  console.info(`brotli: ${outputName}.br <- ${inputName}`);
  await spawn({
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
    stderr: "pipe",
  }).exited;
  return outputNameExt;
};

export default {
  add,
  alias,
  piggyback,
  getReport,
  reset,
};
