interface Rgb {
  readonly r: number;
  readonly g: number;
  readonly b: number;
}

type Hex = string;

type Color = Hex | Rgb;

const toRgb = (color: Color): Rgb => {
  if (typeof color == "object")
    return color;
  if (color[0] == "#")
    color = color.slice(1);
  return color.length == 3 ? {
    r: 17 * parseInt(color[0], 16),
    g: 17 * parseInt(color[1], 16),
    b: 17 * parseInt(color[2], 16),
  } : {
    r: parseInt(color.slice(0, 2), 16),
    g: parseInt(color.slice(2, 4), 16),
    b: parseInt(color.slice(4, 6), 16),
  };
};

const toHex = (color: Color): Hex => {
  if (typeof color == "string")
    return color;
  const {r, g, b} = toRgb(color);
  return "#" +
  r.toString(16).padStart(2, "0") +
  g.toString(16).padStart(2, "0") +
  b.toString(16).padStart(2, "0");
}

const blend = (
  top: Color,
  bottom: Color,
  opacity: number,
): Hex => {
  const topRgb = toRgb(top);
  const botRgb = toRgb(bottom);
  return toHex({
    r: (topRgb.r * opacity + botRgb.r * (1 - opacity)) | 0,
    g: (topRgb.g * opacity + botRgb.g * (1 - opacity)) | 0,
    b: (topRgb.b * opacity + botRgb.b * (1 - opacity)) | 0,
  });
};

export {
  Color,
  Hex,
  Rgb,
  blend,
  toRgb,
  toHex,
};
