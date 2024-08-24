import { expect, test } from "bun:test";
import { parseArgs } from "../cli";

test("smoke tests", () => {
  expect(
    parseArgs("bar --baz 1 2 3 -g a b c".split(" "), "default", { "-g": "gux" }))
    .toEqual({
      "default": "bar",
      "baz": ["1", "2", "3"],
      "gux": "abc".split("")
    });

  expect(
    parseArgs("gux --dux 1 2 3 --dux 4 5 6".split(" "), "def", {}))
    .toEqual({
      "def": "gux",
      "dux": ["4", "5", "6"]
    })
});
