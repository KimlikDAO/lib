import { describe, expect, it } from "bun:test";
import { writeImportStatement } from "../modules";

describe("writeImportStatement tests", () => {
  it("should print default import", () => {
    const importStmt = { unnamed: "defaultExport", named: {} };
    expect(writeImportStatement(importStmt, "module-name"))
      .toBe('import defaultExport from"module-name";');
  });

  it("should print named imports", () => {
    const importStmt = {
      named: {
        "A": "A",
        "LOCAL_B": "imported_B"
      },
    };
    expect(writeImportStatement(importStmt, "hasan"))
      .toBe('import{A,imported_B as LOCAL_B}from"hasan";');
  });

  it("should print default import first and then named imports", () => {
    const importStmt = {
      unnamed: "defaultExport",
      named: {
        "A": "A",
        "B": "B",
        "C": "D"
      },
    };
    expect(writeImportStatement(importStmt, "bun"))
      .toBe('import defaultExport,{A,B,D as C}from"bun";');
  });

  it("should omit from when no symbol is imported", () => {
    const importStmt = { named: {} };
    expect(writeImportStatement(importStmt, "module-name"))
      .toBe('import"module-name";');
  })
});
