import { expect, test } from "bun:test";
import { arfCurve, Point as IPoint } from "../arfCurve";

/** @const {bigint} */
const P = 13n;
/** @const {bigint} */
const Q = 19n;

/**
 * Some experiments with pair elliptic curves of 𝔽_13 and 𝔽_19
 * both given by the equation
 *
 *  y² = x³ + 2
 *
 * @const {function(new:IPoint, bigint, bigint, bigint)} */
const Point = arfCurve(P);
/**
 * @const {function(new:IPoint, bigint, bigint, bigint)} */
const Qoint = arfCurve(Q);

/** @const {!Point} */
const Gp = new Point(1n, 4n, 1n);
/** @const {!Qoint} */
const Gq = new Qoint(4n, 3n, 1n);

test("the order of Point is the base field of Qoint", () => {
  expect(Gp.copy().multiply(Q)).toEqual(new Point(0n, 0n, 0n));
});

test("the order of Qoint is the base field of Point", () => {
  expect(Gq.copy().multiply(P)).toEqual(new Qoint(0n, 0n, 0n));
});
