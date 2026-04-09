interface Point {
  x: number
  y: number
}

class LinePoint implements Point {
  constructor(public x: number, public y: number) { }
  static pointAtX(x: number): Point { return { x, y: 0 } as Point; }
  static pointAtY(y: number): Point { return { x: 0, y } as Point; }
  static yIntercept: Point;
  static xIntercept: Point;
}

const makeDiagonalLine = ({ y0 }: { y0: number }): typeof LinePoint => {
  return class DiagPoint implements Point {
    constructor(public x: number, public y: number) { }

    static pointAtX(x: number) { return new DiagPoint(x, x + y0); }
    static pointAtY(y: number) { return new DiagPoint(y - y0, y); }
    static yIntercept = new DiagPoint(0, y0);
    static xIntercept = new DiagPoint(-y0, 0);
  } as typeof LinePoint;
}

// Class of points on a diagonal line with y-intercept (0, 10)
const DiagLine10 = makeDiagonalLine({ y0: 10 });

console.log(DiagLine10.pointAtY(12));
console.log(DiagLine10.xIntercept);

