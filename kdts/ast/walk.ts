import { Node } from "acorn";

const isNode = (x: unknown): x is Node =>
  !!x && typeof x == "object" && typeof (x as Node).type == "string";

class Walker {
  rec(n: Node | null | undefined, ...rest: unknown[]) {
    if (n && typeof (this as any)[n.type] == "function")
      (this as any)[n.type](n, ...rest);
    else if (n)
      console.error("No method for node type: ", n.type);
  }
};

class Mutator {
  mut(n: Node | null | undefined, ...rest: unknown[]) {
    if (!n) return n;
    const handled = typeof (this as any)[n.type] == "function"
      ? (this as any)[n.type](n, ...rest)
      : undefined;
    if (handled !== true)
      this.mutChildren(n);
    return n;
  }
  replaceNode<T extends Node>(target: Node, next: T, ...staleKeys: string[]): T {
    Object.assign(target, next);
    const record = target as unknown as Record<string, unknown>;
    const nextRecord = next as unknown as Record<string, unknown>;
    for (const key of staleKeys)
      if (!(key in nextRecord))
        delete record[key];
    return target as T;
  }
  mutChildren(n: Node) {
    const record = n as unknown as Record<string, unknown>;
    for (const key in n) {
      if (key == "type" || key == "start" || key == "end" || key == "range" ||
        key == "loc" || key == "typeExpression" || key == "symbolRef")
        continue;
      const value = record[key];
      if (Array.isArray(value)) {
        for (const x of value)
          if (isNode(x))
            this.mut(x);
      } else if (isNode(value))
        this.mut(value);
    }
  }
}

class Generator {
  indent = "";
  out = "";
  rec(n: Node | null | undefined, ...rest: unknown[]) {
    if (n && typeof (this as any)[n.type] == "function")
      (this as any)[n.type](n, ...rest);
    else if (n)
      console.error("No method for node type: ", n.type);
  }
  inc() { this.indent += "  "; }
  dec() { this.indent = this.indent.slice(0, -2); }
  del() { this.out = this.out.slice(0, -1); }
  doc() { this.indent += " * "; this.out += "/**"; }
  cod() {
    const ind = this.indent = this.indent.slice(0, -3);
    this.out += "\n" + ind + " */\n" + ind;
  }
  ret() { this.out += "\n" + this.indent; }
  put(s: string, onNewLine = false) {
    if (onNewLine) this.out += "\n" + this.indent; this.out += s;
  }
  ens(s: string) { if (!this.out.endsWith(s)) this.out += s; }

  arr(a: readonly (Node | null)[], sep: string, ...rest: unknown[]) {
    let s = "";
    for (const x of a) {
      s ? this.put(s) : s = sep;
      this.rec(x, ...rest);
    }
  }
  arrLines(a: readonly (Node | null)[], sep: string, ...rest: unknown[]) {
    let s = "";
    for (const x of a) {
      s ? this.put(s) : s = sep
      this.ret(); this.rec(x, ...rest);
    }
  }
  arrInner(a: readonly Node[], ...rest: unknown[]) {
    let first = true;
    for (const x of a) {
      if (first) first = false; else this.ret();
      this.rec(x, ...rest);
    }
  }
}

export { Walker, Mutator, Generator };
