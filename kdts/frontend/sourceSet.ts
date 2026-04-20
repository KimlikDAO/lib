import { file, write } from "bun";
import { combine } from "../../util/paths";
import { Source, SourceId } from "../model/source";

class SourceSet {
  private readonly bySource = new Map<SourceId, Source>();
  private readonly pending: SourceId[] = [];
  private readonly writes: Promise<number>[] = [];

  constructor(private readonly isolateDir = "") { }

  private track(resolved: Source): boolean {
    if (this.bySource.has(resolved.id))
      return false;
    this.bySource.set(resolved.id, resolved);
    return true;
  }
  add(resolved: Source) {
    if (!this.track(resolved))
      return;
    this.pending.push(resolved.id);
  }
  materialize(source: Source, content: string): Promise<number> {
    if (!this.track(source))
      return Promise.resolve(0);
    return this.write(source.path, content);
  }
  pop(): Source | undefined {
    const source = this.pending.pop();
    if (!source) return;
    return this.bySource.get(source)!;
  }
  read(source: Source): Promise<string> {
    return file(source.path).text();
  }
  write(path: string, content: string): Promise<number> {
    if (!this.isolateDir)
      return Promise.resolve(0);
    const pending = write(combine(this.isolateDir, path), content);
    this.writes.push(pending);
    return pending;
  }
  flushWrites() {
    return Promise.all(this.writes);
  }
  getPaths(): string[] {
    return Array.from(this.bySource.values(), ({ path }) => path).sort();
  }
}

export { SourceSet };
