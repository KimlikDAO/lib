export interface Position {
  offset: number;
  line: number;
  column: number;
}

export interface Location {
  source: string;
  start: Position;
  end: Position;
}

export interface Node {
  readonly type: string;
  readonly loc: Location;
}

export interface Comment extends Node {
  readonly value: string;
}

export interface ListItem<T extends CssNode> {
  prev?: ListItem<T>;
  next?: ListItem<T>;
  data: T;
}

export interface List<T extends CssNode> {
  head?: ListItem<T>;
  tail?: ListItem<T>;
}

export interface StyleSheet extends Node {
  readonly children: List<Comment | Rule | Atrule>;
}

export interface Rule extends Node {
  readonly prelude: SelectorList;
}

export interface SelectorList extends Node {
  readonly children: List<Selector>;
}

export interface Selector extends Node {
  readonly children: List<SelectorNode>;
}

export interface IdSelector extends Node {
  readonly name: string;
}

export interface ClassSelector extends Node {
  readonly name: string;
}

export interface Atrule extends Node {
  readonly name: string;
  readonly block: Block;
}

export interface Block extends Node {
  readonly children: List<CssNode>;
}

export type SelectorNode =
  | Selector
  | IdSelector
  | ClassSelector;

export type CssNode =
  | Comment
  | StyleSheet
  | Rule
  | SelectorList
  | Selector
  | IdSelector
  | ClassSelector
  | Atrule
  | Block;

export function parse(text: string): StyleSheet;
export function generate(ast: Node): string;
