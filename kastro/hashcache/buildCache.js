/**
 * @fileoverview `buildCache` keeps a mapping from asset handles to
 * promises resolving to the `hashedName`.
 *
 * During the build we make additional assumptions that we cannot make
 * in a development server such as source files never changing.
 */

const CACHE = {};

const getByKey = (key, lambda) => CACHE[key] ||= lambda();

export { getByKey };
