import type { Position, TokenType } from "acorn";

type Accessibility = "public" | "protected" | "private";

type VarianceAnnotations = "in" | "out";

type ClassAccessor = "accessor";

type TsModifier =
	| "readonly"
	| "abstract"
	| "declare"
	| "static"
	| "override"
	| "const"
	| Accessibility
	| VarianceAnnotations
	| ClassAccessor;

type LookaheadState = {
	pos: number;
	value: any;
	type: TokenType;
	start: number;
	end: number;
	context: any[];
	startLoc: any;
	endLoc: any;
	lastTokEndLoc: any;
	lastTokStartLoc: any;
	lastTokStart: any;
	lastTokEnd: any;
	curLine: number;
	lineStart: number;
	curPosition: () => Position;
	containsEsc: boolean;
};

type ParsingContext =
	| "EnumMembers"
	| "HeritageClauseElement"
	| "TupleElementTypes"
	| "TypeMembers"
	| "TypeParametersOrArguments";

type ModifierBase = {
	accessibility?: Accessibility;
} & {
	[key in TsModifier]?: boolean | undefined | null;
};

type TryParse<Node, Error, Thrown, Aborted, FailState> = {
	node: Node;
	error: Error;
	thrown: Thrown;
	aborted: Aborted;
	failState: FailState;
};

type AcornTypeScript = {
	tokTypes: Record<string, TokenType>;
	tokContexts: Record<string, TokenType>;
	keywordsRegExp: RegExp;
	tokenIsLiteralPropertyName(token: TokenType): boolean;
	tokenIsKeywordOrIdentifier(token: TokenType): boolean;
	tokenIsIdentifier(token: TokenType): boolean;
	tokenIsTSDeclarationStart(token: TokenType): boolean;
	tokenIsTSTypeOperator(token: TokenType): boolean;
	tokenIsTemplate(token: TokenType): boolean;
};

type AcornJsx = {
	tokTypes: {
		jsxName: TokenType;
		jsxText: TokenType;
		jsxTagEnd: TokenType;
		jsxTagStart: TokenType;
	};
	tokContexts: {
		tc_oTag: any;
		tc_cTag: any;
		tc_expr: any;
	};
};

export type { Accessibility, VarianceAnnotations, ClassAccessor, TsModifier, LookaheadState, ParsingContext, ModifierBase, TryParse, AcornTypeScript, AcornJsx };
