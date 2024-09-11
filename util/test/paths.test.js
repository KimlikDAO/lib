import { expect, test } from "bun:test";
import { combine } from "../paths";

test("negative depth", () => {
  expect(combine("a/b/c", "../../../../x/y/z"))
    .toBe("../x/y/z");
  expect(combine("a/b/c/", "../../../../../x/y/z"))
    .toBe("../../x/y/z");
  expect(combine("../../../", "a/b/c/../../../d/e/f"))
    .toBe("../../../d/e/f");
  expect(combine("a/b", "../../c"))
    .toBe("c");
  expect(combine("", "../../../abc"))
    .toBe("../../../abc");
  expect(combine("./a/b/c", "d"))
    .toBe("a/b/c/d");
});
