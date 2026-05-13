import { hashArray } from "../util/arrays";
import { ActionId, Path, StackState } from "./solver.d";

class GraphNode {
  constructor(
    readonly stack: StackState,
    readonly action: ActionId,
    readonly prev: GraphNode | null,
    readonly g: number,
    readonly h: number
  ) { }

  hash(): number {
    return hashArray(this.stack);
  }

  incomingPath(): Path {
    const actions: ActionId[] = [];
    let node: GraphNode = this;
    for (; node.prev; node = node.prev)
      actions.push(node.action);
    return {
      beg: node.stack,
      actions: actions.reverse(),
      end: this.stack,
    };
  }
}

const compareGraphNodes = (
  a: GraphNode,
  b: GraphNode,
): number => (a.g + a.h) - (b.g + b.h) || a.h - b.h || b.g - a.g;

export { compareGraphNodes, GraphNode };
