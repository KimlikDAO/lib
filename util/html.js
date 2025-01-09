/** @const {!Object<string, boolean>} */
const KapalıTag = {
  animate: true,
  animateTransform: true,
  br: true,
  circle: true,
  ellipse: true,
  feblend: true,
  feBlend: true,
  feFlood: true,
  fegaussianblur: true,
  feGaussianBlur: true,
  feDropShadow: true,
  image: true,
  path: true,
  rect: true,
  stop: true,
  use: true,
  polygon: true,
};

/**
 * @param {string} ad
 * @param {!Object<string, (string|number|boolean|undefined|null)>} nitelikler
 * @param {boolean} kapalı
 * @return {string}
 */
const tagYaz = (ad, nitelikler, kapalı) => {
  /** @type {string} */
  let html = "<" + ad;
  for (const /** string */ nitelik in nitelikler) {
    const val = nitelikler[nitelik];
    if (val || val === 0)
      html += val === true
        ? " " + nitelik
        : ` ${nitelik}="${nitelikler[nitelik]}"`;
  }
  return html + (kapalı ? "/>" : ">");
}

export { KapalıTag, tagYaz };
