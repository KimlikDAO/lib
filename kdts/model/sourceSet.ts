import { write } from "bun";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { SourcePath } from "../frontend/resolver";
import { SourceId } from "./moduleImports";

class SourceSet {
  private readonly bySource = new Map<SourceId, SourcePath>();
  private readonly pending: SourceId[] = [];

  constructor(
    readonly entry?: SourcePath,
    readonly isolateDir = "",
  ) { }

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
  writeIsolated(source: SourcePath, content: string): Promise<number> {
    if (!this.isolateDir)
      throw new Error(`Cannot write ${source.path} without an isolate directory`);
    const outFile = join(this.isolateDir, source.path);
    mkdirSync(dirname(outFile), { recursive: true });
    return write(outFile, content);
  }
}

export { SourceSet };
