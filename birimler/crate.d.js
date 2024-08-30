/** @externs */

import birimler from "./birimler.d";

/**
 * @typedef {{
 *   kök: string,
 *   dizin: string,
 *   sayfalar: !Array<{
 *     tr: string,
 *     en: string
 *   }>,
 *   worker: Object
 * }}
 */
birimler.Crate = {};

export default birimler;
