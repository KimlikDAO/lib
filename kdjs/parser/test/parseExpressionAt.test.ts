import { describe, it, expect } from "bun:test";
import { generateSource, TsParser } from "./utils";

function parseExpressionAt(input: string, pos: number) {
	return TsParser.parseExpressionAt(input, pos, {
		sourceType: "module",
		ecmaVersion: "latest",
		locations: true
	});
}

describe("parseExpressionAt API", () => {
	it("normal", () => {
		const node = parseExpressionAt(generateSource([`<tag prop={`, `  (): void => {}`, `} />`]), 14);

		expect(node.type).toEqual("ArrowFunctionExpression");
	});
});
