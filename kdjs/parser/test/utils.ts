import { expect } from "bun:test";
import * as acorn from "acorn";
import { TsParser, tsPlugin } from "../tsParser";

const DtsParser = acorn.Parser.extend(
	tsPlugin({
		dts: true
	}) as any
);

const JsxParser = acorn.Parser.extend(
	tsPlugin({
		jsx: true
	}) as any
);

function equalNode(node, snapshot) {
	expect(JSON.parse(JSON.stringify(node))).toEqual(snapshot);
}

function parseDtsSource(input: string) {
	return DtsParser.parse(input, {
		sourceType: "module",
		ecmaVersion: "latest",
		locations: true
	});
}

function parseJsxSource(input: string) {
	return JsxParser.parse(input, {
		sourceType: "module",
		ecmaVersion: "latest",
		locations: true
	});
}

function parseSource(input: string) {
	return TsParser.parse(input, {
		sourceType: "module",
		ecmaVersion: "latest",
		locations: true
	});
}

function parseSourceShouldThrowError(input: string, message?: string) {
	const parse = () =>
		TsParser.parse(input, {
			sourceType: "module",
			ecmaVersion: "latest",
			locations: true
		});
	if (message !== undefined) {
		expect(parse).toThrow(message);
	} else {
		expect(parse).toThrow();
	}
}

function generateSource(input: string[]): string {
	return input.join("\n");
}

export {
	TsParser,
	DtsParser,
	JsxParser,
	equalNode,
	parseDtsSource,
	parseJsxSource,
	parseSource,
	parseSourceShouldThrowError,
	generateSource
};
