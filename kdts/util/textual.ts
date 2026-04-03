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
    // Sort beg major and end minor
    const updates = this.updates.sort(
      (a, b) => a.beg == b.beg ? a.end - b.end : a.beg - b.beg);
    let out = "";
    let v = { beg: 0, end: 0, put: "" };
    // flush when v.beg < u.beg  or v.beg == v.end
    // the remaining case is v.beg == u.beg and v.beg != v.end
    // which is a child replacement and should be overriden (no flush)
    for (const u of updates) {
      if (v.beg < u.beg || v.beg == v.end)
        out += v.put + source.substring(v.end, u.beg);
      v = u;
    }
    return out + v.put + source.substring(v.end);
  }
}

export {
  CodeUpdater,
  Update
};
