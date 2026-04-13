import { SourceId } from "./moduleImports";
import { SourcePath } from "../frontend/resolver";

class SourceSet {
  private readonly bySource = new Map<SourceId, SourcePath>();
  private readonly pending: SourceId[] = [];

  add(resolved: SourcePath) {
    if (this.bySource.has(resolved.source))
      return;
    this.bySource.set(resolved.source, resolved);
    this.pending.push(resolved.source);
  }
  pop(): SourcePath | undefined {
    const source = this.pending.pop();
    if (!source) return;
    return this.bySource.get(source)!;
  }
  getPaths(): string[] {
    return Array.from(this.bySource.values(), ({ path }) => path).sort();
  }
}

export { SourceSet };
