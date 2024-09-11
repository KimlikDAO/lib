import { SVGPathData } from "svg-pathdata";

const yuvarla = (f) => f.toFixed(2).replace(/\.?0+$/, '');

function Point(x, y) {
  this.x = x;
  this.y = y;
}

Point.prototype.add = function (q) {
  return new Point(this.x + q.x, this.y + q.y);
}

Point.prototype.addAxb = function (A, b) {
  return new Point(this.x + b, this.y + b * A.y / A.x);
}

Point.prototype.sub = function (q) {
  return new Point(this.x - q.x, this.y - q.y)
}

Point.prototype.decX = function (delta) {
  this.x -= delta;
  return this;
}

Point.prototype.sc = function (c) {
  return `x${c}="${yuvarla(this.x)}" y${c}="${yuvarla(this.y)}"`;
}

Point.prototype.s1 = function () {
  return this.sc("1");
}

Point.prototype.s2 = function () {
  return this.sc("2");
}

Point.prototype.s = function () {
  return this.sc("");
}

const sayıDoğrusu = (en, boy, renk) =>
  `<path d="M0 ${boy / 2}h${en}M${en / 2} 0v${boy}" stroke="${renk}"/>`;

/**
 * @param {number} a
 * @param {number} b
 * @param {number} en
 * @param {number} boy
 * @param {string} renk
 * @return {string}
 */
const gerçelEliptikEğri = (a, b, en, boy, renk) => {
  const delta0 = 20;

  const y0 = delta0 * Math.sqrt(b);
  const discr = Math.sqrt(4 * a * a * a + 27 * b * b);

  /** @const {number} */
  const t = Math.pow(Math.sqrt(3) * discr - 9 * b, 1 / 3);
  /** @const {number} */
  const x0 = delta0 * (t / Math.pow(18, 1 / 3) - a * Math.pow(2 / 3, 1 / 3) / t);
  /** @const {number} */
  const dydx = a / 2 / Math.sqrt(b);

  const delta1 = 15;
  const delta2 = 25;
  const delta3 = 20;
  const dy2dx = 3;

  const x2 = 70;

  const d = new SVGPathData([{
    type: SVGPathData.MOVE_TO,
    x: en / 2 + x0, y: boy / 2
  }, {
    relative: true,
    type: SVGPathData.CURVE_TO,
    x1: 0, y1: -delta1,
    x2: -x0 - delta1, y2: -y0 + delta2 * dydx,
    x: -x0, y: -y0
  }, {
    relative: false,
    type: SVGPathData.SMOOTH_CURVE_TO,
    x2: en / 2 + x2 - delta3,
    y2: delta3 * dy2dx,
    x: en / 2 + x2,
    y: 0
  }, {
    type: SVGPathData.MOVE_TO,
    x: en / 2 + x0, y: boy / 2
  }, {
    relative: true,
    type: SVGPathData.CURVE_TO,
    x1: 0, y1: delta1,
    x2: -x0 - delta1, y2: y0 - delta2 * dydx,
    x: -x0, y: y0,
  }, {
    relative: false,
    type: SVGPathData.SMOOTH_CURVE_TO,
    x2: en / 2 + x2 - delta3,
    y2: boy - delta3 * dy2dx,
    x: en / 2 + x2,
    y: boy
  }]).round(1e3).encode();

  return `<path d="${d}" stroke="${renk}" fill="none" stroke-width="2"/>`;
}

export {
  Point,
  gerçelEliptikEğri,
  sayıDoğrusu
};
