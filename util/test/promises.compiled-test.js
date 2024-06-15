import { assertArrayEq } from "../../testing/assert";
import { bekle, darboğaz } from "../promises";

const db = darboğaz(3);

Promise.all([
  db(() => bekle(1, 1000)),
  db(() => bekle(2, 1000)),
  db(() => bekle(3, 1000))
]).then((değerler) => assertArrayEq(değerler, [1, 2, 3]));
