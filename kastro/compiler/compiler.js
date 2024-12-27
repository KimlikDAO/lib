import { access, cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { keccak256Uint8 } from "../../crypto/sha3";
import { getDir, getExt } from "../../util/paths";
import { Props } from "../props";
import { CompressedMimes } from "../workers/mimes";
import { brotli, zopfli } from "./compression";
import hash from "./hash";
import marker from "./marker";
import { getTargetFunction } from "./targetRegistry";

/**
 * Dev: Try to do as little work as possible while providing the fundamental
 *      functionality of kastro such as component rendering, i18n, and updating
 *      the js defines. The rendered page should be visually identical to the
 *      Compiled version; anything else is a bug.
 *
 * Compiled: Produce the most optimized version of the app, while not making
 *      any assumptions on the freshness of the source. In this mode, we
 *      take a content hash of the dependencies of each targe to determine
 *      whether to rebuild the target or not.
 *
 * Release: Produce the most optimized version of the app, while assuming
 *      the source code does not change during the build process. With this
 *      assumption, we can memoize the built targets without checking if their
 *      dependencies have changed.
 *
 * @enum {number}
 */
const BuildMode = {
  Dev: 0,
  Compiled: 1,
  Release: 2
};

/** @const {!TextEncoder} */
const Encoder = new TextEncoder();

/** @const {!Object<string, (CacheEntry|undefined)>} */
const CACHE = {};

const populateChildTargets = (props) => {
  const childProps = {
    BuildMode: props.BuildMode,
    Lang: props.Lang
  };
  if (Array.isArray(props.childTargets))
    props.childTargets = props.childTargets.map((target) => {
      if (target instanceof Promise) return target;
      if (typeof target == "object" && target.content) {
        const content = typeof target.content == "string" ? Encoder.encode(target.content) : target.content;
        return Promise.resolve({
          targetName: target.targetName,
          content,
          contentHash: keccak256Uint8(content),
        })
      }
      const targetName = typeof target == "string" ? target : target.targetName;
      const props = typeof target == "string" ? childProps : target.props;
      return buildTarget(targetName, props)
        .then((entry) => ({
          ...entry,
          targetName
        }));
    });
}

/**
 * @param {Props} props
 * @return {!Promise<string>}
 */
const computeDepHash = (props) => {
  populateChildTargets(props);
  const { childTargets = [], ...otherProps } = props;
  const acc = keccak256Uint8(Encoder.encode(JSON.stringify(otherProps))).slice(0, 32);
  return Promise.all(childTargets.map((childTarget) => childTarget
    .then(({ contentHash }) => hash.combine(acc, contentHash))))
    .then(() => acc);
}

/**
 * Removes the marker file and builds the target fresh from source.
 *
 * @const {TargetFunction}
 */
const forceBuildTarget = (targetName, props) => {
  console.log("forceBuildTarget()", targetName);

  populateChildTargets(props);
  const targetFunc = getTargetFunction(targetName);
  if (!targetFunc) console.error("targetFunc not found", targetName);
  return Promise.all([targetFunc(targetName, props), marker.remove(targetName)])
    .then(([result, _]) => result);
}

/**
 *
 *
 * @const {TargetFunction}
 */
const buildTarget = (targetName, props) => {
  console.log(`buildTarget(): ${targetName}`);

  if (!targetName.startsWith("/build/"))
    return CACHE[targetName] ||= readFile(targetName.slice(1)).then((content) => ({
      content,
      contentHash: keccak256Uint8(content),
    }));

  if (props.BuildMode == BuildMode.Release)
    return (CACHE[targetName] ||= forceBuildTarget(targetName, props));

  return CACHE[targetName] = Promise.all([CACHE[targetName], computeDepHash(props)])
    .then(([entry, depHash]) => {
      if (entry && hash.equal(entry.depHash, depHash))
        return entry;

      return marker.read(targetName)
        .then((markerEntry) => hash.equal(markerEntry.depHash, depHash)
          ? Promise.resolve() : Promise.reject())
        .catch(() => forceBuildTarget(targetName, props))
        .then((maybeResult) => {
          const fileName = targetName.slice(1);
          if (!maybeResult)
            return readFile(fileName);
          if (typeof maybeResult === "string")
            maybeResult = Encoder.encode(maybeResult);
          return mkdir(getDir(fileName), { recursive: true })
            .then(() => writeFile(fileName, maybeResult))
            .then(() => maybeResult);
        })
        .then((content) => marker.write(targetName, {
          content,
          contentHash: keccak256Uint8(content),
          depHash,
        }));
    })
}

/**
 * Builds the target, creates bundle file and compresses versions if needed,
 * and returns the bundle name of the asset.
 *
 * @const {TargetFunction} */
const bundleTarget = (targetName, props) => props.BuildMode == BuildMode.Dev
  ? Promise.resolve(props.childTargets[0].slice(1))
  : buildTarget(targetName, props).then(({ contentHash }) => {
    /** @const {string} */
    const targetFile = targetName.slice(1);
    /** @const {string} */
    const assetName = `build/${hash.toStr(contentHash)}.${getExt(targetName)}`;
    /** @const {!Promise<void>} */
    const bundle = CompressedMimes[getExt(targetName)]
      ? access(assetName).catch(() => cp(targetFile, assetName))
      : Promise.all([
        access(assetName).catch(() => cp(targetFile, assetName)),
        access(`${assetName}.br`).catch(() => brotli(targetFile, assetName)),
        access(`${assetName}.gz`).catch(() => zopfli(targetFile, assetName))
      ])
    return bundle.then(() => assetName.slice(6));
  });

export default {
  BuildMode,
  bundleTarget,
  buildTarget,
  forceBuildTarget
};
