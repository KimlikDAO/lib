/** SVG / void-style tag names that serialize with `/>` when empty. */
const VoidElementTag: Record<string, boolean> = {
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

const htmlTag = (
  tagName: string,
  props: Record<string, string | number | boolean | null | undefined>,
  selfClosing: boolean,
): string => {
  let html = "<" + tagName;
  for (const attr in props) {
    const val = props[attr];
    if (val || val === 0)
      html += val === true
        ? " " + attr : ` ${attr}="${props[attr]}"`;
  }
  return html + (selfClosing ? "/>" : ">");
};

export { htmlTag, VoidElementTag };
