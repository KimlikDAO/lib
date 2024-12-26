import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { keccak256, keccak256Uint8 } from "../../crypto/sha3";
import { getDir } from "../../util/paths";
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
  if (Array.isArray(props.childTargets)
    && props.childTargets.length
    && typeof props.childTargets[0] == "string"
  )
    props.childTargets = props.childTargets.map(
      (target) => typeof target == "string"
        ? buildTarget(target, childProps)
          .then((entry) => ({
            ...entry,
            targetName: target
          }))
        : Promise.resolve({
          ...target,
          contentHash: keccak256(target.content),
        })
    );
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

  return Promise.all([CACHE[targetName], computeDepHash(props)])
    .then(([entry, depHash]) => {
      if (entry && hash.equal(entry.depHash, depHash))
        return entry;

      return CACHE[targetName] = marker.read(targetName)
        .then((markerEntry) => hash.equal(markerEntry.depHash, depHa2600sh)
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
    const ext = getExt(targetName);
    /** @const {string} */
    const assetName = `build/${contentHash}.${ext}`;
    /** @const {!Promise<void>} */
    const bundle = CompressedMimes[ext]
      ? access(assetName).catch(() => cp(targetName, assetName))
      : Promise.all([
        access(assetName).catch(() => cp(targetName, assetName)),
        access(`${assetName}.br`).catch(() => brotli(targetName, assetName)),
        access(`${assetName}.gz`).catch(() => zopfli(targetName, assetName))
      ])
    return bundle.then(() => assetName.slice(7));
  });

export default {
  BuildMode,
  bundleTarget,
  buildTarget,
  forceBuildTarget
};
