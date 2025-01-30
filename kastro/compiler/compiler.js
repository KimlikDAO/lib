import { access, cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { keccak256Uint8 } from "../../crypto/sha3";
import { getDir, getExt } from "../../util/paths";
import { Props } from "../props";
import { CompressedMimes } from "../workers/mimes";
import { brotli, zopfli } from "./compression";
import hash, { AssetHash } from "./hash";
import marker from "./marker";
import { getTargetFunction } from "./targetRegistry";

/**
 * Dev: Try to do as little work as possible while providing the fundamental
 *      functionality of kastro such as component rendering, i18n, and updating
 *      the js defines. The rendered page should be visually identical to the
 *      Compiled or Release version; anything else is a bug.
 *
 * Compiled: Produce the most optimized version of the app while obeying the
 *      constraint that each target is a function of its dependencies.
 *      This means, for instance, that generated domIds are a function of
 *      the explicit dependencies and cannot depend on a global counter.
 *
 * Release: Produce the most optimized version of the app, while assuming
 *      the source code does not change during the build process. In this mode
 *      we can violate the constraint that each target is a function of its
 *      dependencies, which allows us, for instance, to compress the domIds
 *      using a global counter.
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

/** @const {!Object<string, AssetHash>} */
const NAMED_ASSETS = {};

/** @const {!Object<string, AssetHash>} */
const PIGGYBACK_ASSETS = {};

/**
 * @param {Props} props
 */
const populateChildTargets = (props) => {
  const childProps = {
    BuildMode: props.BuildMode,
    Lang: props.Lang
  };
  if (Array.isArray(props.childTargets))
    props.childTargets = props.childTargets.map((target) => {
      if (typeof target.then === "function") return target;
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
  const acc = keccak256Uint8(Encoder.encode(JSON.stringify(otherProps)))
    .slice(0, 32); // Drop the excess buffer.
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
  populateChildTargets(props);
  const targetFunc = getTargetFunction(targetName);
  if (!targetFunc) console.error("targetFunc not found", targetName, targetFunc);
  return targetFunc(targetName, props);
}

/**
 * Builds a given target. This involves
 *  1. Building all childTargets
 *  2. Determining the targetFunction from the extension of the targetName
 *  3. Handing the targetName and props (which includes the childTargets) to
 *     the targetFunction.
 *
 * @const {TargetFunction}
 */
const buildTarget = (targetName, props) => {
  if (!targetName.startsWith("/build/"))
    return CACHE[targetName] ||= readFile(targetName.slice(1)).then((content) => ({
      content,
      contentHash: keccak256Uint8(content),
    }));

  // Explicit list of dependencies.
  if (!props.dynamicDeps)
    return CACHE[targetName] = Promise.all([CACHE[targetName], computeDepHash(props)])
      .then(([entry, depHash]) => {
        if (entry && hash.equal(entry.depHash, depHash))
          return entry;

        return marker.read(targetName)
          .then((markerEntry) => hash.equal(markerEntry.depHash, depHash)
            ? Promise.resolve() : Promise.reject())
          .catch(() => marker.remove(targetName)
            .then(() => forceBuildTarget(targetName, props)))
          .then((maybeResult) => {
            const fileName = targetName.slice(1);
            if (!maybeResult)
              return readFile(fileName);
            if (typeof maybeResult === "string")
              maybeResult = Encoder.encode(maybeResult);
            return mkdir(getDir(fileName), { recursive: true })
              .catch(() => { })
              .then(() => writeFile(fileName, maybeResult))
              .then(() => maybeResult);
          })
          .then((content) => marker.write(targetName, {
            content,
            contentHash: keccak256Uint8(content),
            depHash,
          }));
      });

  // Dynamic dependencies.
  return CACHE[targetName] = (CACHE[targetName] || Promise.resolve())
    .then((entry) => {
      let fromCachePromise;
      let newDepHash;
      props.checkFreshFn = (deps) => {
        props.childTargets = deps.map((dep) => "/" + dep);
        return computeDepHash(props)
          .then((depHash) => {
            newDepHash = depHash;
            if (entry && hash.equal(entry.depHash, depHash)) {
              fromCachePromise = Promise.resolve(entry);
              return true;
            }
            return marker.read(targetName)
              .then((markerEntry) => {
                const diskFresh = hash.equal(markerEntry.depHash, depHash);
                if (diskFresh)
                  fromCachePromise = readFile(targetName.slice(1))
                    .then((content) => ({
                      targetName,
                      content,
                      ...markerEntry,
                    }));
                return diskFresh;
              })
              .catch(() => false)
          })
      }
      return forceBuildTarget(targetName, props)
        .then((maybeResult) => {
          if (!maybeResult) return fromCachePromise;
          if (typeof maybeResult === "string")
            maybeResult = Encoder.encode(maybeResult);
          return mkdir(getDir(targetName.slice(1)), { recursive: true })
            .catch(() => { })
            .then(() => writeFile(targetName.slice(1), maybeResult))
            .then(() => marker.write(targetName, {
              content: maybeResult,
              contentHash: keccak256Uint8(maybeResult),
              depHash: newDepHash,
            }));
        })
    })
}

/**
 * Builds the target, creates the bundle file and compressed versions if needed,
 * and returns the bundle name of the asset.
 *
 * @const {TargetFunction} */
const bundleTarget = (targetName, props) => props.BuildMode == BuildMode.Dev
  ? Promise.resolve(props.childTargets[0])
    .then((target) => (typeof target == "string") ? target.slice(1) : target.targetName)
  : buildTarget(targetName, props).then(({ contentHash }) => {
    /** @const {string} */
    const targetFile = targetName.slice(1);
    /** @const {string} */
    const contentHashStr = hash.toStr(contentHash);
    /** @const {string} */
    const bundleName = "build/bundle/" +
      (props.bundleName || `${contentHashStr}.${getExt(targetName)}`);
    if (props.bundleName)
      NAMED_ASSETS[props.bundleName] = contentHashStr;

    if (props.piggyback) {
      const piggybackUrl = `${props.piggyback}/${props.bundleName.slice(12)}`;
      PIGGYBACK_ASSETS[piggybackUrl] = contentHashStr;
      return piggybackUrl;
    }
    /** @const {!Promise<void>} */
    const bundle = mkdir("build/bundle", { recursive: true })
      .catch(() => { })
      .then(() =>
        CompressedMimes[getExt(targetName)]
          ? access(bundleName).catch(() => cp(targetFile, bundleName))
          : Promise.all([
            access(bundleName).catch(() => cp(targetFile, bundleName)),
            access(`${bundleName}.br`).catch(() => brotli(targetFile, bundleName)),
            access(`${bundleName}.gz`).catch(() => zopfli(targetFile, bundleName))
          ])
      );
    return bundle.then(() => bundleName.slice(13));
  });

/**
 * @return {!Object<string, string>}
 */
const getNamedAssets = () => NAMED_ASSETS;

export default {
  BuildMode,
  bundleTarget,
  buildTarget,
  forceBuildTarget,
  getNamedAssets,
};
