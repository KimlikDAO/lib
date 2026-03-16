import { expect, test } from "bun:test";
import process from "node:process";
import { fileFromError } from "../reflection";

test("fileFromError",
  /** @suppress {reportUnknownTypes} */
  () => {
    const error = new Error();
    expect(fileFromError(error))
      .toBe(import.meta.path.slice(process.cwd().length + 1));
  }
);
