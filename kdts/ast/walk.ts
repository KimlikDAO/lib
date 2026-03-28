import { Node } from "acorn";

class Walker {
  rec(n: Node | null | undefined, ...rest: unknown[]) {
    if (n && typeof (this as any)[n.type] == "function")
      (this as any)[n.type](n, ...rest);
    else if (n)
      console.error("No method for node type: ", n.type);
  }
};

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
  put(s: string) { this.out += s; }
  ens(s: string) { if (!this.out.endsWith(s)) this.out += s; }
  ret(c?: string) { this.out += (c ?? "") + "\n" + this.indent; }

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

export { Walker, Generator };
