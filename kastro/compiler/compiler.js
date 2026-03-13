import { write } from "bun";
import { readFile } from "node:fs/promises";
import { keccak256Uint8 } from "../../crypto/sha3";
import { getExt } from "../../util/paths";
import { Props } from "../props";
import hash from "./hash";
import marker from "./marker";
import { getTargetFunction, Target, TargetFunction } from "./target";
import bundle from "./bundle";

/**
 * Dev: Try to do as little work as possible while providing the fundamental
 *      functionality of kastro such as component rendering, i18n, and updating
 *      the js defines. The rendered page should be visually identical to the
 *      Compiled version; anything else is a bug.
 *
 * Compiled: All assets get the same treatment as Release (fonts, images, css, html)
 *      however the js bundle is compiled with kdjs --fast.
 *
 * Release: Produce the most optimized version of the app. Js bundle is
 *      compiled with kdjs in the full optimization mode.
 *
 * @enum {number}
 */
const BuildMode = {
  Dev: 0,
  Compiled: 1,
  Release: 2,
};

/** @const {TextEncoder} */
const Encoder = new TextEncoder();

/** @const {Record<string, Target | undefined>} */
const CACHE = {};

/**
 * @param {string} targetName
 * @return {Promise<Target>}
 */
const fileTarget = (targetName, props) => {
  const contentPromise = props.BuildMode == BuildMode.Dev
    ? readFile(targetName.slice(1))
    : (CACHE[targetName] ||= readFile(targetName.slice(1)));
  return contentPromise.then((content) => ({
    content,
    contentHash: keccak256Uint8(content),
  }));
}

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
      if (typeof target.then == "function") return target;
      if (typeof target == "object" && target.content) {
        const content = typeof target.content == "string" ? Encoder.encode(target.content) : target.content;
        return Promise.resolve({
          targetName: target.targetName,
          content,
          contentHash: keccak256Uint8(content),
        })
      }
      const targetName = typeof target == "string" ? target : target.targetName;
      const props = typeof target == "string" ? childProps : target;
      return buildTarget(targetName, props)
        .then((childTarget) => ({
          ...childTarget,
          targetName
        }));
    });
}

/**
 * @param {Props} props
 * @return {Promise<Uint8Array>}
 */
const computeDepHash = (props) => {
  populateChildTargets(props);
  const { 
    childTargets = [],
    targetName,
    checkFreshFn,
    ...otherProps
  } = props;
  const acc = keccak256Uint8(Encoder.encode(JSON.stringify(otherProps)));
  return Promise.all(
    childTargets.map((childTarget) => childTarget
      .then(({ contentHash }) => hash.combine(acc, contentHash)))
  )
    .then(() => acc);
}

/**
 * Normalizes the childTargets to actual `Promise<Target>`'s and runs the
 * {@link TargetFunction} with the targetName and props.
 *
 * @const {TargetFunction}
 */
const forceBuildTarget = (targetName, props) => {
  if (!props.dynamicDeps)
    console.info("Building:", targetName);
  populateChildTargets(props);
  const targetFunc = getTargetFunction(targetName);
  if (!targetFunc) console.error("targetFunc not found", targetName);
  return targetFunc(targetName, props);
}

const buildTargetOnly = (targetName, props) => {
  if (!targetName.startsWith("/build/"))
    return fileTarget(targetName, props);

  // Always build targets: when deps are large and the targetFunction is cheap.
  if (props.alwaysBuild)
    return forceBuildTarget(targetName, props)
      .then((maybeResult) => {
        if (typeof maybeResult != "string")
          throw "Not implemented yet";
        const content = Encoder.encode(maybeResult);
        return write(targetName.slice(1), content)
          .then(() => ({
            content,
            contentHash: keccak256Uint8(content),
          }))
      });

  // Explicit list of dependencies.
  if (!props.dynamicDeps)
    return CACHE[targetName] = Promise.all([CACHE[targetName], computeDepHash(props)])
      .then(([target, depHash]) => {
        if (target && hash.equal(target.depHash, depHash))
          return target;

        return marker.read(targetName)
          .then((markerEntry) => hash.equal(markerEntry.depHash, depHash)
            ? Promise.resolve() : Promise.reject())
          .catch(() => marker.remove(targetName)
            .then(() => forceBuildTarget(targetName, props)))
          .then((maybeResult) => {
            const fileName = targetName.slice(1);
            if (!maybeResult)
              return readFile(fileName);
            if (typeof maybeResult == "string")
              maybeResult = Encoder.encode(maybeResult);
            return write(fileName, maybeResult)
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
        props.childTargets = deps;
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
          if (typeof maybeResult == "string")
            maybeResult = Encoder.encode(maybeResult);
          return write(targetName.slice(1), maybeResult)
            .then(() => marker.write(targetName, {
              content: maybeResult,
              contentHash: keccak256Uint8(maybeResult),
              depHash: newDepHash,
            }));
        })
    })
}

/**
 * Builds a given target. This involves
 *  1. Building all childTargets
 *  2. Determining the targetFunction from the extension of the targetName
 *  3. Handing the targetName and props (which includes the childTargets) to
 *     the targetFunction.
 *  4. Returning a `Target` containing at least `content` and `contentHash`
 *
 * @param {string} targetName
 * @param {Props} props
 * @return {Promise<Target>}
 */
const buildTarget = async (targetName, props) => {
  const target = await buildTargetOnly(targetName, props);
  const hashStr = hash.toStr(target.contentHash)
  const hashedName = `${hashStr}.${getExt(targetName)}`;
  const bundleName = props.bundleName || hashedName;
  if (props.piggyback) {
    bundle.piggyback(props.piggyback, bundleName);
    return target;
  }
  if (props.bundleHashed || props.bundleName)
    await bundle.add(targetName, hashedName);
  if (props.bundleName)
    await bundle.alias(bundleName, hashedName);
  return target;
};

/**
 * Marks the target as a bundle target, builds it, and returns the bundle name
 * of the asset.
 *
 * @param {string} targetName
 * @param {Props} props
 * @return {Promise<string>}
 */
const bundleTarget = (targetName, props) => {
  if (!props.bundleName) props.bundleHashed = true;
  return buildTarget(targetName, props)
    .then(({ contentHash }) => {
      const bundleName = props.bundleName ||
        `${hash.toStr(contentHash)}.${getExt(targetName)}`
      return props.piggyback ? `${props.piggyback}/${bundleName}` : bundleName;
    });
}

export default {
  BuildMode,
  bundleTarget,
  buildTarget
};
