
/**
 * @typedef {{
 *   r: number,
 *   g: number,
 *   b: number
 * }}
 */
const Renk = {};

/**
 * @param {string} renk
 * @return {Renk}
 */
const hexten = (renk) => {
  if (renk[0] == "#")
    renk = renk.slice(1);
  return renk.length == 3 ? {
    r: 17 * parseInt(renk[0], 16),
    g: 17 * parseInt(renk[1], 16),
    b: 17 * parseInt(renk[2], 16)
  } : {
    r: parseInt(renk.slice(0, 2), 16),
    g: parseInt(renk.slice(2, 4), 16),
    b: parseInt(renk.slice(4, 6), 16)
  };
}

/**
 * @param {Renk} renk
 * @return {string}
 */
const hex = (renk) => "#" + renk.r.toString(16).padStart(2, '0')
  + renk.g.toString(16).padStart(2, '0')
  + renk.b.toString(16).padStart(2, '0');

/**
 * @param {string|Renk} altRenk
 * @param {string|Renk} üstRenk
 * @param {number} geçirgenlik
 * @return {string}
 */
const karıştır = (altRenk, üstRenk, geçirgenlik) => {
  if (typeof altRenk == "string")
    altRenk = hexten(altRenk);
  if (typeof üstRenk == "string")
    üstRenk = hexten(üstRenk);

  return hex({
    r: (altRenk.r * geçirgenlik + üstRenk.r * (1 - geçirgenlik)) | 0,
    g: (altRenk.g * geçirgenlik + üstRenk.g * (1 - geçirgenlik)) | 0,
    b: (altRenk.b * geçirgenlik + üstRenk.b * (1 - geçirgenlik)) | 0
  });
};

export {
  hexten,
  hex,
  karıştır
};
