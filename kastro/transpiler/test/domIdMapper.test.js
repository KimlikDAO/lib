import { expect, test } from "bun:test";
import { indexToMinified, GlobalMapper, LocalMapper } from "../domIdMapper";

test("indexToMinified", () => {
  expect(indexToMinified(0)).toBe("A");
  expect(indexToMinified(1)).toBe("B");
  expect(indexToMinified(25)).toBe("Z");
  expect(indexToMinified(26)).toBe("a");
  expect(indexToMinified(51)).toBe("z");
  expect(indexToMinified(52)).toBe("AA");
  expect(indexToMinified(53)).toBe("AB");
});

test("GlobalMapper", () => {
  const mapper = new GlobalMapper();
  const aFoo = mapper.map("mpa", "a", "foo");
  const aBar = mapper.map("mpa", "a", "bar");
  const bFoo = mapper.map("mpa", "b", "foo");
  const bBar = mapper.map("mpa", "b", "bar");

  expect(mapper.map("mpa", "a", "foo")).toBe(aFoo);
  expect(mapper.map("mpa", "a", "bar")).toBe(aBar);
  expect(mapper.map("mpa", "b", "foo")).toBe(bFoo);
  expect(mapper.map("mpa", "b", "bar")).toBe(bBar);

  expect(aFoo).not.toBe(bFoo);
  expect(aBar).not.toBe(bBar);
});

test("LocalMapper", () => {
  const mapper = new LocalMapper();
  const aFoo = mapper.map("mpa", "a", "foo");
  const aBar = mapper.map("mpa", "a", "bar");
  const bFoo = mapper.map("mpa", "b", "foo");
  const bBar = mapper.map("mpa", "b", "bar");

  expect(mapper.map("mpa", "a", "foo")).toBe(aFoo);
  expect(mapper.map("mpa", "a", "bar")).toBe(aBar);
  expect(mapper.map("mpa", "b", "foo")).toBe(bFoo);
  expect(mapper.map("mpa", "b", "bar")).toBe(bBar);

  expect(aFoo).not.toBe(bFoo);
  expect(aBar).not.toBe(bBar);
  expect(aFoo.slice(0, 4)).toBe(aBar.slice(0, 4));
  expect(bFoo.slice(0, 4)).toBe(bBar.slice(0, 4));
});
