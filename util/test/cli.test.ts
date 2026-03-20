import { expect, test } from "bun:test";
import { CliArgs, parseArgs } from "../cli";

test("CliArgs.asStringOr() / asList(): string + string[] + remapped key", () => {
  const args = parseArgs(
    "bar --baz 1 2 3 -g a b c".split(" "),
    "default",
    { "-g": "gux" }
  );
  expect(args.asStringOr("default", "")).toEqual("bar");
  expect(args.asList("baz")).toEqual(["1", "2", "3"]);
  expect(args.asList("gux")).toEqual("abc".split(""));
});

test("CliArgs.asStringOr() / asList(): repeated key becomes last string[]", () => {
  const args = parseArgs(
    "gux --dux 1 2 3 --dux 4 5 6".split(" "),
    "def",
    {}
  );
  expect(args.asStringOr("def", "")).toEqual("gux");
  expect(args.asList("dux")).toEqual(["4", "5", "6"]);
});

test("CliArgs.asRecord(): JSON string -> object", () => {
  const args = parseArgs(`bar --rec {"a":1}`.split(" "), "default", {});
  expect(args.asRecord("rec")).toEqual({ a: 1 });
});

test("CliArgs.asRecord(): string[] -> {}", () => {
  const args = parseArgs(`bar --arr 1 2 3`.split(" "), "default", {});
  expect(args.asRecord("arr")).toEqual({});
});

test("CliArgs.asRecord(): boolean (key present with no value) -> {}", () => {
  const args = parseArgs(`bar --b`.split(" "), "default", {});
  expect(args.asRecord("b")).toEqual({});
});

test("CliArgs.asRecord(): pre-typed Record returned as-is", () => {
  const args = new CliArgs({
    "rec": { "k": "v" },
    "arr": ["x", "y"],
    "bool": true,
    "str": '{"z":2}',
  });
  expect(args.asRecord("rec")).toEqual({ "k": "v" });
  expect(args.asRecord("arr")).toEqual({});
  expect(args.asRecord("bool")).toEqual({});
  expect(args.asRecord("str")).toEqual({ "z": 2 });
});
