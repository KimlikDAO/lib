/**
 * @typedef {{
 *   beg: number,
 *   end: number,
 *   put: string
 * }}
 */
const Update = {};

/**
 * @param {string} orig
 * @param {!Array<Update>} updates
 * @return {string}
 */
const update = (orig, updates) => {
  updates.sort((a, b) => a.beg - b.beg);
  /** @type {string} */
  let updated = "";
  /** @type {number} */
  let last = 0;
  for (const update of updates) {
    updated += orig.substring(last, update.beg) + update.put;
    last = update.end;
  }
  return updated + orig.substring(last);
}

export {
  Update,
  update
};
