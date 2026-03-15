import { SVGPathData } from "svg-pathdata";
import { Color, toHex } from "./color";

const round = (f: number): string => f.toFixed(2).replace(/\.?0+$/, '');

class Point {
  constructor(public x: number, public y: number) { }

  add(q: Point): Point {
    return new Point(this.x + q.x, this.y + q.y);
  }
  addAxb(A: Point, b: number): Point {
    return new Point(this.x + b, this.y + b * A.y / A.x);
  }
  sub(q: Point): Point {
    return new Point(this.x - q.x, this.y - q.y);
  }
  decX(delta: number): Point {
    this.x -= delta;
    return this;
  }
  sc(c: string): string {
    return `x${c}="${round(this.x)}" y${c}="${round(this.y)}"`;
  }
  s1(): string {
    return this.sc("1");
  }
  s2(): string {
    return this.sc("2");
  }
  s(): string {
    return this.sc("");
  }
}

type SVGFragment = string;

/**
 * Draws a number line of a given length and color.
 */
const numberLine = (width: number, height: number, color: Color): SVGFragment =>
  `<path d="M0 ${height / 2}h${width}M${width / 2} 0v${height}" stroke="${toHex(color)}"/>`;

const bezierEllipticCurve = (
  a: number,
  b: number,
  width: number,
  height: number,
  color: Color
): SVGFragment => {
  const delta0 = 20;

  const y0 = delta0 * Math.sqrt(b);
  const discr = Math.sqrt(4 * a * a * a + 27 * b * b);

  const t = Math.pow(Math.sqrt(3) * discr - 9 * b, 1 / 3);
  const x0 = delta0 * (t / Math.pow(18, 1 / 3) - a * Math.pow(2 / 3, 1 / 3) / t);
  const dydx = a / 2 / Math.sqrt(b);

  const delta1 = 15;
  const delta2 = 25;
  const delta3 = 20;
  const dy2dx = 3;

  const x2 = 70;

  const d = new SVGPathData([{
    relative: false,
    type: SVGPathData.MOVE_TO,
    x: width / 2 + x0, y: height / 2
  }, {
    relative: true,
    type: SVGPathData.CURVE_TO,
    x1: 0, y1: -delta1,
    x2: -x0 - delta1, y2: -y0 + delta2 * dydx,
    x: -x0, y: -y0
  }, {
    relative: false,
    type: SVGPathData.SMOOTH_CURVE_TO,
    x2: width / 2 + x2 - delta3,
    y2: delta3 * dy2dx,
    x: width / 2 + x2,
    y: 0
  }, {
    relative: false,
    type: SVGPathData.MOVE_TO,
    x: width / 2 + x0, y: height / 2
  }, {
    relative: true,
    type: SVGPathData.CURVE_TO,
    x1: 0, y1: delta1,
    x2: -x0 - delta1, y2: y0 - delta2 * dydx,
    x: -x0, y: y0,
  }, {
    relative: false,
    type: SVGPathData.SMOOTH_CURVE_TO,
    x2: width / 2 + x2 - delta3,
    y2: height - delta3 * dy2dx,
    x: width / 2 + x2,
    y: height
  }]).round(1e3).encode();

  return `<path d="${d}" stroke="${toHex(color)}" fill="none" stroke-width="2"/>`;
}

export {
  Point,
  bezierEllipticCurve,
  numberLine
};
