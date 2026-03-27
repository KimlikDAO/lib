import { Node } from "acorn";

type Update = {
  beg: number;
  end: number;
  put: string;
};

class CodeUpdater {
  readonly updates: Update[] = [];

  replace(node: Node, put: string) {
    this.replaceRange(node.start, node.end, put);
  }
  insertBefore(node: Node, put: string) {
    this.replaceRange(node.start, node.start, put);
  }
  insertAfter(node: Node, put: string) {
    this.replaceRange(node.end, node.end, put);
  }
  private replaceRange(beg: number, end: number, put: string) {
    this.updates.push({ beg, end, put });
  }
  apply(source: string): string {
    const updates = this.updates.sort((a, b) => a.beg - b.beg);
    let out = "";
    let last = 0;
    for (const { beg, end, put } of updates) {
      if (beg < last)
        throw `CodeUpdater updates overlap near (${beg}, ${end}); previous update ended at ${last}`;
      out += source.substring(last, beg) + put;
      last = end;
    }
    return out + source.substring(last);
  }
}

export {
  CodeUpdater,
  Update
};
