import { expect, test } from "bun:test";
import { CliArgs } from "../cli";

const fromArgv = (
  args: string[],
  defaultKey: string,
  shortKeyMap: Record<string, string> = {}
): CliArgs => CliArgs.fromArgv(["bun", "script", ...args], defaultKey, shortKeyMap);

test("CliArgs.asStringOr() / asList(): string + string[] + remapped key", () => {
  const args = fromArgv(
    "bar --baz 1 2 3 -g a b c".split(" "),
    "default",
    { "-g": "gux" }
  );
  expect(args.asStringOr("default", "")).toEqual("bar");
  expect(args.asList("baz")).toEqual(["1", "2", "3"]);
  expect(args.asList("gux")).toEqual("abc".split(""));
});

test("CliArgs.asStringOr() / asList(): repeated key appends values", () => {
  const args = fromArgv(
    "gux --dux 1 2 3 --dux 4 5 6".split(" "),
    "def",
    {}
  );
  expect(args.asStringOr("def", "")).toEqual("gux");
  expect(args.asList("dux")).toEqual(["1", "2", "3", "4", "5", "6"]);
});

test("CliArgs.asRecord(): JSON string -> object", () => {
  const args = fromArgv(`bar --rec {"a":1}`.split(" "), "default", {});
  expect(args.asRecord("rec")).toEqual({ a: 1 });
});

test("CliArgs.asRecord(): string[] -> {}", () => {
  const args = fromArgv(`bar --arr 1 2 3`.split(" "), "default", {});
  expect(args.asRecord("arr")).toEqual({});
});

test("CliArgs.asRecord(): boolean (key present with no value) -> {}", () => {
  const args = fromArgv(`bar --b`.split(" "), "default", {});
  expect(args.asRecord("b")).toEqual({});
  expect(args.isTrue("b")).toBe(true);
});

test("CliArgs.from(): typed inputs map into flat CLI lists", () => {
  const rec = { "k": "v" };
  const args = CliArgs.from({
    "rec": rec,
    "arr": ["x", "y"],
    "bool": true,
    "falseBool": false,
    "str": '{"z":2}',
  });
  expect(args.asRecord("rec")).toBe(rec);
  expect(args.asList("arr")).toEqual(["x", "y"]);
  expect(args.isTrue("bool")).toBe(true);
  expect(args.isTrue("falseBool")).toBe(false);
  expect(args.asRecord("str")).toEqual({ "z": 2 });
});
