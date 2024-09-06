/** @const {!Object<string, boolean>} */
const KapalıTagler = {
  animate: true,
  animateTransform: true,
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
 * @param {!Object<string, string>} nitelikler
 * @param {boolean} kapalı
 * @return {string}
 */
const tagYaz = (ad, nitelikler, kapalı) => {
  /** @type {string} */
  let html = "<" + ad;
  for (const /** string */ nitelik in nitelikler)
    html += nitelikler[nitelik]
      ? ` ${nitelik}="${nitelikler[nitelik]}"`
      : " " + nitelik;
  return html + (kapalı ? "/>" : ">");
}

export { KapalıTagler, tagYaz };
